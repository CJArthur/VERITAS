"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Search, Upload, PlusCircle, ChevronRight, AlertTriangle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { DiplomaListItem, ApiError, apiGet, apiPost, apiPostForm, DOCUMENT_TYPE_LABEL } from "@/lib/api";

interface DiplomaTableProps {
  initial: DiplomaListItem[];
}

interface AddForm {
  graduate_full_name: string;
  birth_date: string;
  study_end_year: number;
  specialty_name: string;
  specialty_code: string;
  diploma_number: string;
  qualification: string;
  document_type: string;
  issuer_name: string;
  gpa: number;
  issue_date: string;
}

const defaultForm = (): AddForm => ({
  graduate_full_name: "",
  birth_date: "2000-01-01",
  study_end_year: new Date().getFullYear(),
  specialty_name: "",
  specialty_code: "",
  diploma_number: "",
  qualification: "bachelor",
  document_type: "diploma",
  issuer_name: "",
  gpa: 0,
  issue_date: "",
});

const QUALIFICATION_LABEL: Record<string, string> = {
  bachelor:   "Бакалавр",
  master:     "Магистр",
  specialist: "Специалист",
  phd:        "Кандидат наук / Аспирант",
};

// Ключ инвалидации — prefix matching покрывает все варианты запроса
const DIPLOMAS_QUERY_KEY = ["university-diplomas"] as const;

export function DiplomaTable({ initial }: DiplomaTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(defaultForm());
  const [csvResult, setCsvResult] = useState<{ created: number; errors: string[] } | null>(null);

  // Debounce поиска — не спамим API при каждом символе
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: diplomas = initial, isFetching } = useQuery({
    queryKey: [...DIPLOMAS_QUERY_KEY, debouncedQuery],
    queryFn: () =>
      debouncedQuery.length >= 2
        ? apiGet<DiplomaListItem[]>(
            `/api/v1/issuer/diplomas/search?q=${encodeURIComponent(debouncedQuery)}`
          )
        : apiGet<DiplomaListItem[]>("/api/v1/issuer/diplomas"),
    // SSR-данные используем как начальное состояние при пустом поиске
    initialData: debouncedQuery ? undefined : initial,
    placeholderData: keepPreviousData, // список не мигает при смене запроса
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: (form: AddForm) => {
      const body: Record<string, unknown> = {
        graduate_full_name: form.graduate_full_name,
        birth_date: form.birth_date,
        study_end_year: form.study_end_year,
        specialty_name: form.specialty_name,
        diploma_number: form.diploma_number,
        qualification: form.qualification,
        document_type: form.document_type,
        gpa: form.gpa,
      };
      if (form.issue_date) body.issue_date = form.issue_date;
      if (form.specialty_code) body.specialty_code = form.specialty_code;
      if (form.issuer_name) body.issuer_name = form.issuer_name;
      return apiPost<DiplomaListItem>("/api/v1/issuer/diplomas/manual", body);
    },
    onSuccess: () => {
      setAddOpen(false);
      setAddForm(defaultForm());
      queryClient.invalidateQueries({ queryKey: DIPLOMAS_QUERY_KEY });
    },
  });

  const csvMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiPostForm<{ created: number; errors: string[] }>(
        "/api/v1/issuer/diplomas/bulk-upload",
        form
      );
    },
    onSuccess: (result) => {
      setCsvResult(result);
      queryClient.invalidateQueries({ queryKey: DIPLOMAS_QUERY_KEY });
    },
  });

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    csvMutation.mutate(file);
    e.target.value = "";
  }

  return (
    <div>
      {/* CSV result banner */}
      {csvResult && (
        <div className="mb-4 flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          <span className="font-medium">Импорт завершён:</span>
          добавлено {csvResult.created}
          {csvResult.errors.length > 0 && (
            <span className="text-amber-700">, ошибок: {csvResult.errors.length}</span>
          )}
          <button className="ml-auto text-stone-400 hover:text-stone-600" onClick={() => setCsvResult(null)}>✕</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Поиск по ФИО или номеру..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAddOpen(!addOpen)}
            className="flex-1 sm:flex-none border-[#a05c20] text-[#a05c20] hover:bg-[#a05c20] hover:text-white"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Добавить
          </Button>
          <label
            className={
              buttonVariants({ variant: "outline" }) +
              " cursor-pointer flex-1 sm:flex-none" +
              (csvMutation.isPending ? " opacity-50 pointer-events-none" : "")
            }
          >
            <Upload className="h-4 w-4 mr-2" />
            {csvMutation.isPending ? "Загрузка..." : "CSV"}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvUpload}
              disabled={csvMutation.isPending}
            />
          </label>
        </div>
      </div>

      {/* Manual add form */}
      {addOpen && (
        <form
          onSubmit={(e) => { e.preventDefault(); addMutation.mutate(addForm); }}
          className="mb-6 bg-white border border-stone-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="space-y-1 col-span-full">
            <label className="text-xs font-medium text-[#1c1917]">ФИО выпускника</label>
            <Input placeholder="Иванов Иван Иванович" value={addForm.graduate_full_name}
              onChange={(e) => setAddForm((p) => ({ ...p, graduate_full_name: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#1c1917]">Дата рождения</label>
            <Input type="date" value={addForm.birth_date}
              onChange={(e) => setAddForm((p) => ({ ...p, birth_date: e.target.value }))} required />
            <p className="text-[10px] text-stone-400">Используется студентом для привязки диплома</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#1c1917]">Год окончания</label>
            <Input type="number" min={1950} max={2100} value={addForm.study_end_year}
              onChange={(e) => setAddForm((p) => ({ ...p, study_end_year: Number(e.target.value) }))} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#1c1917]">Средний балл (ГПА)</label>
            <Input type="number" min={0} max={5} step={0.1} placeholder="4.5"
              value={addForm.gpa || ""}
              onChange={(e) => setAddForm((p) => ({ ...p, gpa: Number(e.target.value) }))} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#1c1917]">Дата выдачи</label>
            <Input type="date" value={addForm.issue_date}
              onChange={(e) => setAddForm((p) => ({ ...p, issue_date: e.target.value }))} />
            <p className="text-[10px] text-stone-400">Не заполнено — автоматически 30 июня</p>
          </div>
          {addForm.document_type === "diploma" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#1c1917]">Код специальности (ОКСО)</label>
              <Input
                placeholder="09.03.01"
                pattern="\d{2}\.\d{2}\.\d{2}"
                title="Формат: ХХ.ХХ.ХХ (код ОКСО)"
                value={addForm.specialty_code}
                onChange={(e) => setAddForm((p) => ({ ...p, specialty_code: e.target.value }))}
                required
              />
            </div>
          )}
          <div className="space-y-1 col-span-full">
            <label className="text-xs font-medium text-[#1c1917]">Специальность</label>
            <Input placeholder="Информатика и вычислительная техника" value={addForm.specialty_name}
              onChange={(e) => setAddForm((p) => ({ ...p, specialty_name: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#1c1917]">Номер документа</label>
            <Input placeholder="107704 1234567" value={addForm.diploma_number}
              onChange={(e) => setAddForm((p) => ({ ...p, diploma_number: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#1c1917]">Квалификация</label>
            <select
              value={addForm.qualification}
              onChange={(e) => setAddForm((p) => ({ ...p, qualification: e.target.value }))}
              className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-[#1c1917] focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              {(Object.entries(QUALIFICATION_LABEL) as [string, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#1c1917]">Тип документа</label>
            <select
              value={addForm.document_type}
              onChange={(e) => setAddForm((p) => ({ ...p, document_type: e.target.value }))}
              className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-[#1c1917] focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              {(Object.entries(DOCUMENT_TYPE_LABEL) as [string, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          {addForm.document_type !== "diploma" && (
            <div className="space-y-1 col-span-full">
              <label className="text-xs font-medium text-[#1c1917]">Организация-выдавший (если не ВУЗ)</label>
              <Input placeholder="ООО Образовательный центр / Coursera" value={addForm.issuer_name}
                onChange={(e) => setAddForm((p) => ({ ...p, issuer_name: e.target.value }))} />
            </div>
          )}
          {addMutation.error && (
            <div className="col-span-full flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              {addMutation.error instanceof ApiError
                ? addMutation.error.detail
                : "Ошибка добавления"}
            </div>
          )}
          <div className="col-span-full flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Отмена</Button>
            <Button type="submit" disabled={addMutation.isPending} className="bg-[#1c1917] text-[#f0d4a0]">
              {addMutation.isPending ? "Сохранение..." : `Добавить ${DOCUMENT_TYPE_LABEL[addForm.document_type as keyof typeof DOCUMENT_TYPE_LABEL]?.toLowerCase() ?? "документ"}`}
            </Button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        {isFetching && diplomas.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-stone-400">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Загрузка...
          </div>
        ) : diplomas.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <p className="font-medium">Дипломы не найдены</p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">ФИО</th>
                  <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Специальность</th>
                  <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Год</th>
                  <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Номер</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Статус</th>
                  <th className="w-8 sm:w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {diplomas.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-stone-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/issuer/diplomas/${d.id}`)}
                  >
                    <td className="px-3 sm:px-4 py-3 font-medium text-[#1c1917]">
                      <div>{d.graduate_full_name}</div>
                      <div className="sm:hidden text-xs text-stone-400 mt-0.5">{d.study_end_year}</div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-stone-600 max-w-[180px] truncate">{d.specialty_name}</td>
                    <td className="hidden sm:table-cell px-4 py-3 text-stone-600">{d.study_end_year}</td>
                    <td className="hidden lg:table-cell px-4 py-3 font-mono text-xs text-stone-500">{d.registration_number}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <StatusBadge status={d.status as "active" | "revoked" | "suspended"} />
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

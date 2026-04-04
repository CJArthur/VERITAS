import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, ShieldX, BookOpen, Clock } from "lucide-react";
import { apiGet, DiplomaDetail } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { RevokeButton } from "./RevokeButton";
import { CopyButton } from "@/components/CopyButton";

export const dynamic = "force-dynamic";

export default async function DiplomaDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/login");

  let diploma: DiplomaDetail;
  try {
    diploma = await apiGet<DiplomaDetail>(
      `/api/v1/university/diplomas/${params.id}`,
      `access_token=${token}`
    );
  } catch {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/university" className="flex items-center gap-1.5 text-stone-400 hover:text-[#a05c20] text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" />
          К списку
        </Link>
        <span className="text-stone-300">/</span>
        <span className="text-[#1c1917] text-sm font-medium">{diploma.graduate_full_name}</span>
      </div>

      <div className="bg-[#1c1917] rounded-xl p-6 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f0d4a0] mb-1">{diploma.graduate_full_name}</h1>
          <p className="text-stone-400 text-sm">{diploma.specialty_name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={diploma.status as "active" | "revoked" | "suspended"} />
          {diploma.signature_valid ? (
            <span className="flex items-center gap-1 text-green-400 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" /> Подпись верна
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-400 text-xs">
              <ShieldX className="h-3.5 w-3.5" /> Подпись не верна
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
              <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Данные диплома</h2>
            </div>
            <div className="divide-y divide-stone-100">
              {[
                { label: "Номер диплома", value: diploma.registration_number, mono: true },
                { label: "Серийный номер", value: diploma.serial_number, mono: true },
                { label: "Дата выдачи", value: diploma.issue_date },
                { label: "Код специальности", value: diploma.specialty_code, mono: true },
                { label: "Период обучения", value: `${diploma.study_start_year} — ${diploma.study_end_year}` },
                { label: "Средний балл", value: String(diploma.gpa) },
              ].map((row) => (
                <div key={row.label} className="flex flex-col sm:flex-row sm:items-center px-4 sm:px-5 py-2.5 sm:py-3 gap-0.5 sm:gap-4">
                  <span className="text-[11px] text-stone-400 sm:w-36 sm:flex-shrink-0 uppercase tracking-wider">{row.label}</span>
                  <span className={`text-sm text-[#1c1917] font-medium ${row.mono ? "font-mono" : ""}`}>{row.value}</span>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row sm:items-center px-4 sm:px-5 py-2.5 sm:py-3 gap-0.5 sm:gap-4">
                <span className="text-[11px] text-stone-400 sm:w-36 sm:flex-shrink-0 uppercase tracking-wider">Hash данных</span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm text-[#1c1917] font-mono font-medium truncate">{diploma.data_hash.slice(0, 24)}…</span>
                  <CopyButton text={diploma.data_hash} />
                </div>
              </div>
            </div>
          </div>

          {diploma.subjects.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-stone-100 bg-stone-50 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-stone-400" />
                <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Транскрипт ({diploma.subjects.length} дисциплин)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="text-left px-3 sm:px-4 py-2 text-xs text-stone-400 font-medium">Дисциплина</th>
                      <th className="hidden sm:table-cell text-right px-4 py-2 text-xs text-stone-400 font-medium">Часы</th>
                      <th className="hidden sm:table-cell text-right px-4 py-2 text-xs text-stone-400 font-medium">З.е.</th>
                      <th className="text-right px-3 sm:px-4 py-2 text-xs text-stone-400 font-medium">Оценка</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {diploma.subjects.map((s, i) => (
                      <tr key={i} className="hover:bg-stone-50">
                        <td className="px-3 sm:px-4 py-2 text-[#1c1917] text-sm">{s.subject_name}</td>
                        <td className="hidden sm:table-cell px-4 py-2 text-right text-stone-500">{s.hours}</td>
                        <td className="hidden sm:table-cell px-4 py-2 text-right text-stone-500">{s.credits}</td>
                        <td className={`px-3 sm:px-4 py-2 text-right font-semibold text-sm ${s.grade >= 4 ? "text-green-600" : "text-red-600"}`}>{s.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {diploma.status === "active" && (
            <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3 shadow-sm">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Действия</h3>
              <RevokeButton diplomaId={diploma.id} />
            </div>
          )}
          {diploma.status === "revoked" && diploma.revoke_reason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700 mb-1">Причина аннулирования</p>
              <p className="text-sm text-red-600">{diploma.revoke_reason}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-stone-100 bg-stone-50 flex items-center gap-2">
              <Clock className="h-4 w-4 text-stone-400" />
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Лог проверок ({diploma.logs.length})
              </h3>
            </div>
            {diploma.logs.length === 0 ? (
              <p className="px-4 py-4 text-xs text-stone-400">Проверок ещё не было</p>
            ) : (
              <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
                {diploma.logs.slice(0, 20).map((log, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-xs font-semibold ${log.result === "ok" ? "text-green-600" : "text-red-600"}`}>
                        {log.result === "ok" ? "Успешно" : log.result}
                      </span>
                      <span className="text-xs text-stone-400">{log.verifier_type}</span>
                    </div>
                    <p className="text-xs text-stone-400">{log.verifier_ip}</p>
                    <p className="text-xs text-stone-300">{new Date(log.verified_at).toLocaleString("ru-RU")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

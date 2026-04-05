"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClaimDiplomaPage() {
  const router = useRouter();
  const [form, setForm] = useState({ registration_number: "", graduate_full_name: "", birth_year: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
      const res = await fetch(`${apiUrl}/api/v1/student/diplomas/claim`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_number: form.registration_number.trim(),
          graduate_full_name: form.graduate_full_name.trim(),
          birth_year: form.birth_year ? Number(form.birth_year) : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body.detail || "Диплом не найден или уже привязан");
      }
      setSuccess(true);
      setTimeout(() => router.push("/student"), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Ошибка привязки диплома");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/student" className="flex items-center gap-1.5 text-stone-400 hover:text-[#a05c20] text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Link>
        <span className="text-stone-300">/</span>
        <span className="text-[#1c1917] text-sm font-medium">Привязать диплом</span>
      </div>

      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-[#1c1917] mb-2">Привязать диплом</h1>
        <p className="text-stone-500 text-sm mb-8">
          Введите данные вашего диплома. Они должны точно совпадать с информацией в реестре ВУЗа.
        </p>

        {success ? (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="text-xl font-bold text-[#1c1917] mb-2">Диплом привязан</h2>
            <p className="text-stone-500 text-sm">Перенаправляем в личный кабинет...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[#1c1917] font-medium text-sm">Номер диплома (регистрационный)</Label>
              <Input
                placeholder="107704 1234567"
                value={form.registration_number}
                onChange={(e) => setForm((p) => ({ ...p, registration_number: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#1c1917] font-medium text-sm">ФИО (как в дипломе)</Label>
              <Input
                placeholder="Иванов Иван Иванович"
                value={form.graduate_full_name}
                onChange={(e) => setForm((p) => ({ ...p, graduate_full_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#1c1917] font-medium text-sm">Год рождения</Label>
              <Input
                type="number"
                placeholder="1999"
                min={1900}
                max={2010}
                value={form.birth_year}
                onChange={(e) => setForm((p) => ({ ...p, birth_year: e.target.value }))}
                required
              />
              <p className="text-xs text-stone-400">Для подтверждения вашей личности</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading}
              className="w-full bg-[#1c1917] text-[#f0d4a0] hover:bg-[#2a2622] font-semibold">
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Поиск..." : "Привязать диплом"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Building2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UniversityRegisterPage() {
  const [form, setForm] = useState({
    login: "", email: "", password: "", confirm: "",
    university_name: "", ogrn: "", license_number: "", accreditation_number: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Пароли не совпадают"); return; }
    if (form.ogrn.length !== 13) { setError("ОГРН должен содержать 13 цифр"); return; }
    setError(""); setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
      const res = await fetch(`${apiUrl}/api/v1/register/university`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: form.login, email: form.email, password: form.password,
          university_name: form.university_name, ogrn: form.ogrn,
          license_number: form.license_number, accreditation_number: form.accreditation_number,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body.detail || "Ошибка подачи заявки");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Ошибка подачи заявки");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-8">
        <div className="max-w-sm w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold text-[#1c1917] mb-2">Заявка подана</h2>
          <p className="text-stone-500 text-sm mb-2">Подтвердите email. Затем заявка будет рассмотрена администратором.</p>
          <p className="text-stone-400 text-xs mb-6">Вы получите уведомление после одобрения.</p>
          <Link href="/login" className="text-[#a05c20] font-medium hover:underline">Перейти ко входу</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex">
      <div className="hidden lg:flex lg:w-2/5 bg-[#1c1917] flex-col items-center justify-center p-12 relative">
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-stone-500 hover:text-[#f0d4a0] text-xs transition-colors group">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          На главную
        </Link>
        <div className="relative mb-6">
          <Shield className="h-24 w-24 text-[#a05c20]" strokeWidth={1} />
          <span className="absolute inset-0 flex items-center justify-center text-[#f0d4a0] font-bold text-3xl">V</span>
        </div>
        <h1 className="text-[#f0d4a0] font-bold text-3xl tracking-widest mb-3">VERITAS</h1>
        <p className="text-stone-400 text-center text-sm max-w-xs leading-relaxed">
          Подключите ваше учебное заведение. Заявка проверяется администратором.
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md py-6 sm:py-8">
          <div className="lg:hidden flex justify-end mb-4">
            <Link href="/" className="flex items-center gap-1.5 text-stone-400 hover:text-[#a05c20] text-xs transition-colors group">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              На главную
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-[#1c1917] mb-1">Регистрация ВУЗа</h2>
          <p className="text-stone-500 text-sm mb-6">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-[#a05c20] hover:underline font-medium">Войти</Link>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-t border-stone-200 pt-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />Учебное заведение
              </p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#1c1917]">Полное название</Label>
                  <Input placeholder="ФГБОУ ВО «...»" value={form.university_name} onChange={set("university_name")} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#1c1917]">ОГРН</Label>
                    <Input placeholder="1234567890123" value={form.ogrn} onChange={set("ogrn")} maxLength={13} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#1c1917]">Лицензия</Label>
                    <Input placeholder="№ 123456" value={form.license_number} onChange={set("license_number")} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#1c1917]">Свидетельство об аккредитации</Label>
                  <Input placeholder="№ 654321" value={form.accreditation_number} onChange={set("accreditation_number")} required />
                </div>
              </div>
            </div>
            <div className="border-t border-stone-200 pt-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Учётная запись оператора</p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#1c1917]">Логин</Label>
                  <Input placeholder="operator_login" value={form.login} onChange={set("login")} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#1c1917]">Email</Label>
                  <Input type="email" placeholder="admin@university.ru" value={form.email} onChange={set("email")} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#1c1917]">Пароль</Label>
                    <Input type="password" placeholder="Мин. 8 символов" value={form.password} onChange={set("password")} minLength={8} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#1c1917]">Повтор</Label>
                    <Input type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} minLength={8} required />
                  </div>
                </div>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
              </div>
            )}
            <Button type="submit" disabled={loading}
              className="w-full bg-[#1c1917] text-[#f0d4a0] hover:bg-[#2a2622] font-semibold">
              {loading ? "Отправка..." : "Подать заявку"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

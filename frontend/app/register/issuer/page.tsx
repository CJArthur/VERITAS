"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Building2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type IssuerType = "university" | "training_center" | "corporate" | "certification_body";

const ISSUER_TYPE_OPTIONS: { value: IssuerType; label: string; hint: string }[] = [
  {
    value: "university",
    label: "ВУЗ / учебное заведение",
    hint: "Государственная аккредитация обязательна",
  },
  {
    value: "training_center",
    label: "Учебный центр / онлайн-школа",
    hint: "Skillbox, Нетология, Яндекс Практикум и т.п.",
  },
  {
    value: "corporate",
    label: "Корпоративная академия",
    hint: "Внутреннее обучение компании",
  },
  {
    value: "certification_body",
    label: "Сертификационный центр",
    hint: "Профессиональные объединения, СРО",
  },
];

// Какие поля нужны для каждого типа
const NEEDS_LICENSE: Record<IssuerType, boolean> = {
  university: true,
  training_center: true,
  corporate: false,
  certification_body: true,
};
const NEEDS_ACCREDITATION: Record<IssuerType, boolean> = {
  university: true,
  training_center: false,
  corporate: false,
  certification_body: false,
};

export default function IssuerRegisterPage() {
  const [form, setForm] = useState({
    login: "",
    email: "",
    password: "",
    confirm: "",
    issuer_name: "",
    ogrn: "",
    issuer_type: "university" as IssuerType,
    license_number: "",
    accreditation_number: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  const needsLicense = NEEDS_LICENSE[form.issuer_type];
  const needsAccreditation = NEEDS_ACCREDITATION[form.issuer_type];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Пароли не совпадают");
      return;
    }
    if (form.ogrn.length !== 13 && form.ogrn.length !== 15) {
      setError("ОГРН — 13 цифр (юрлицо) или 15 цифр (ИП)");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
      const body: Record<string, string> = {
        login: form.login,
        email: form.email,
        password: form.password,
        issuer_name: form.issuer_name,
        ogrn: form.ogrn,
        issuer_type: form.issuer_type,
        license_number: form.license_number,
      };
      if (needsAccreditation && form.accreditation_number) {
        body.accreditation_number = form.accreditation_number;
      }
      const res = await fetch(`${apiUrl}/api/v1/register/university`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(res.status, data.detail || "Ошибка подачи заявки");
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
          <p className="text-stone-500 text-sm mb-2">
            Подтвердите email. Затем заявка будет рассмотрена администратором.
          </p>
          <p className="text-stone-400 text-xs mb-6">
            Администратор автоматически проверяет ОГРН по реестру ФНС/ЕГРЮЛ перед принятием решения.
          </p>
          <Link href="/login" className="text-[#a05c20] font-medium hover:underline">
            Перейти ко входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-2/5 bg-[#1c1917] flex-col items-center justify-center p-12 relative">
        <Link
          href="/"
          className="absolute top-6 left-6 flex items-center gap-1.5 text-stone-500 hover:text-[#f0d4a0] text-xs transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          На главную
        </Link>
        <div className="relative mb-6">
          <Shield className="h-24 w-24 text-[#a05c20]" strokeWidth={1} />
          <span className="absolute inset-0 flex items-center justify-center text-[#f0d4a0] font-bold text-3xl">
            V
          </span>
        </div>
        <h1 className="text-[#f0d4a0] font-bold text-3xl tracking-widest mb-3">VERITAS</h1>
        <p className="text-stone-400 text-center text-sm max-w-xs leading-relaxed mb-8">
          Подключите вашу организацию. Заявка проверяется администратором с автоматической
          верификацией ОГРН по реестру ФНС/ЕГРЮЛ.
        </p>
        <div className="space-y-2 w-full max-w-xs">
          {[
            "Подать заявку с ОГРН",
            "Подтвердить email",
            "Дождаться одобрения администратора",
            "Загружать документы",
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border border-[#a05c20]/40 flex items-center justify-center text-[10px] font-bold text-[#a05c20] flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-stone-500 text-xs">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form ── */}
      <div className="flex-1 flex items-start justify-center p-6 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md py-6 sm:py-10">
          <div className="lg:hidden flex justify-end mb-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-stone-400 hover:text-[#a05c20] text-xs transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              На главную
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1c1917] mb-1">Регистрация организации</h2>
          <p className="text-stone-500 text-sm mb-6">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-[#a05c20] hover:underline font-medium">
              Войти
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Org section ── */}
            <div className="border-t border-stone-200 pt-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Организация
              </p>
              <div className="space-y-3">
                {/* Тип организации */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#1c1917]">Тип организации</Label>
                  <select
                    value={form.issuer_type}
                    onChange={set("issuer_type")}
                    className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-[#1c1917] focus:outline-none focus:ring-2 focus:ring-stone-400"
                    required
                  >
                    {ISSUER_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-stone-400">
                    {ISSUER_TYPE_OPTIONS.find((o) => o.value === form.issuer_type)?.hint}
                  </p>
                </div>

                {/* Название */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#1c1917]">Полное название</Label>
                  <Input
                    placeholder={
                      form.issuer_type === "university"
                        ? "ФГБОУ ВО «...»"
                        : form.issuer_type === "corporate"
                          ? "ООО «Компания» / Корпоративный университет"
                          : "ООО «Образовательный центр»"
                    }
                    value={form.issuer_name}
                    onChange={set("issuer_name")}
                    required
                  />
                </div>

                {/* ОГРН */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#1c1917]">ОГРН</Label>
                  <Input
                    placeholder="1234567890123"
                    value={form.ogrn}
                    onChange={set("ogrn")}
                    maxLength={15}
                    pattern="\d{13}|\d{15}"
                    inputMode="numeric"
                    required
                  />
                  <p className="text-[11px] text-stone-400">
                    13 цифр — юрлицо, 15 цифр — ИП. Проверяется автоматически по ЕГРЮЛ.
                  </p>
                </div>

                {/* Лицензия — только для тех, кому нужна */}
                {needsLicense && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#1c1917]">
                      Лицензия на образовательную деятельность
                    </Label>
                    <Input
                      placeholder="№ 123456"
                      value={form.license_number}
                      onChange={set("license_number")}
                      required
                    />
                    <p className="text-[11px] text-stone-400">
                      Выдаётся Рособрнадзором. Проверяется администратором.
                    </p>
                  </div>
                )}

                {/* Аккредитация — только для ВУЗов */}
                {needsAccreditation && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#1c1917]">
                      Свидетельство о государственной аккредитации
                    </Label>
                    <Input
                      placeholder="№ 654321"
                      value={form.accreditation_number}
                      onChange={set("accreditation_number")}
                      required
                    />
                    <p className="text-[11px] text-stone-400">
                      Обязательно для выдачи государственных дипломов.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Account section ── */}
            <div className="border-t border-stone-200 pt-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Учётная запись оператора
              </p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#1c1917]">Логин</Label>
                  <Input
                    placeholder="operator_login"
                    value={form.login}
                    onChange={set("login")}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#1c1917]">Email</Label>
                  <Input
                    type="email"
                    placeholder="admin@organization.ru"
                    value={form.email}
                    onChange={set("email")}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#1c1917]">Пароль</Label>
                    <Input
                      type="password"
                      placeholder="Мин. 8 символов"
                      value={form.password}
                      onChange={set("password")}
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#1c1917]">Повтор</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={form.confirm}
                      onChange={set("confirm")}
                      minLength={8}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1c1917] text-[#f0d4a0] hover:bg-[#2a2622] font-semibold"
            >
              {loading ? "Отправка..." : "Подать заявку"}
            </Button>

            <p className="text-[11px] text-stone-400 text-center leading-relaxed">
              После подачи заявки администратор автоматически проверяет данные по ЕГРЮЛ
              и принимает решение об одобрении.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

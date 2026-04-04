"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, User, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [form, setForm] = useState({ login: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Пароли не совпадают"); return; }
    setError(""); setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
      const res = await fetch(`${apiUrl}/api/v1/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: form.login, email: form.email, password: form.password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body.detail || "Ошибка регистрации");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-8">
        <div className="max-w-sm w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold text-[#1c1917] mb-2">Регистрация завершена</h2>
          <p className="text-stone-500 text-sm mb-6">
            Проверьте почту и подтвердите email-адрес для активации аккаунта.
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
      <div className="hidden lg:flex lg:w-1/2 bg-[#1c1917] flex-col items-center justify-center p-12">
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-stone-500 hover:text-[#f0d4a0] text-xs transition-colors group">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          На главную
        </Link>
        <div className="relative mb-6">
          <Shield className="h-24 w-24 text-[#a05c20]" strokeWidth={1} />
          <span className="absolute inset-0 flex items-center justify-center text-[#f0d4a0] font-bold text-3xl tracking-wider">V</span>
        </div>
        <h1 className="text-[#f0d4a0] font-bold text-3xl tracking-widest mb-3">VERITAS</h1>
        <p className="text-stone-400 text-center text-sm max-w-xs leading-relaxed">
          Создайте аккаунт студента и привяжите свои дипломы — чтобы поделиться ими с работодателями.
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-end mb-6">
            <Link href="/" className="flex items-center gap-1.5 text-stone-400 hover:text-[#a05c20] text-xs transition-colors group">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              На главную
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-[#1c1917] mb-1">Регистрация студента</h2>
          <p className="text-stone-500 text-sm mb-8">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-[#a05c20] hover:underline font-medium">Войти</Link>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#1c1917] font-medium text-sm">Логин</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input placeholder="username" value={form.login} onChange={set("login")} className="pl-9" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#1c1917] font-medium text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} className="pl-9" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#1c1917] font-medium text-sm">Пароль</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input type={showPassword ? "text" : "password"} placeholder="Минимум 8 символов" value={form.password} onChange={set("password")} className="pl-9 pr-9" required minLength={8} />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#1c1917] font-medium text-sm">
                Повторите пароль
                {form.confirm && (
                  <span className={`ml-2 text-xs font-normal ${form.password === form.confirm ? "text-green-600" : "text-red-500"}`}>
                    {form.password === form.confirm ? "✓ совпадают" : "не совпадают"}
                  </span>
                )}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.confirm} onChange={set("confirm")} className="pl-9" required minLength={8} />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-[#1c1917] hover:bg-[#2a2622] text-[#f0d4a0] font-semibold">
              {loading ? "Регистрация..." : "Создать аккаунт"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

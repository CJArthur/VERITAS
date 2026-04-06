"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Mail, Lock, AlertCircle, ArrowLeft, Eye, EyeOff, CheckCircle, Clock } from "lucide-react";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Notice = { type: "success" | "warning" | "error"; text: string };

function VerificationNotice({ onNotice }: { onNotice: (n: Notice | null) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const verified = searchParams.get("verified");
    const pending = searchParams.get("pending");
    if (verified === "ok" && pending === "1") {
      onNotice({ type: "warning", text: "Email подтверждён. Войти вы сможете после того, как администратор VERITAS одобрит заявку вашего учебного заведения." });
    } else if (verified === "expired") {
      onNotice({ type: "error", text: "Ссылка для подтверждения устарела или уже использована. Зарегистрируйтесь повторно." });
    } else if (verified === "not_found") {
      onNotice({ type: "error", text: "Пользователь не найден. Попробуйте зарегистрироваться заново." });
    }
  }, [searchParams, onNotice]);

  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
      const loginRes = await fetch(`${apiUrl}/api/v1/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok) {
        throw new ApiError(loginRes.status, body.detail || "Ошибка входа");
      }
      const role: string = body.role ?? "";
      if (role === "student") router.push("/student");
      else if (role === "university_staff") router.push("/issuer");
      else if (role === "super_admin") router.push("/admin");
      else throw new ApiError(200, `Неизвестная роль: ${role}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? "Неверный email или пароль" : err.detail);
      } else {
        setError("Ошибка соединения с сервером");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex">
      <Suspense fallback={null}>
        <VerificationNotice onNotice={setNotice} />
      </Suspense>

      {/* Left — dark brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1c1917] flex-col items-center justify-center p-12 relative">
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-stone-500 hover:text-[#f0d4a0] text-xs transition-colors group">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          На главную
        </Link>
        <div className="relative mb-6">
          <Shield className="h-24 w-24 text-[#a05c20]" strokeWidth={1} />
          <span className="absolute inset-0 flex items-center justify-center text-[#f0d4a0] font-bold text-3xl tracking-wider">
            V
          </span>
        </div>
        <h1 className="text-[#f0d4a0] font-bold text-3xl tracking-widest mb-3">
          VERITAS
        </h1>
        <p className="text-stone-400 text-center text-sm max-w-xs leading-relaxed">
          Криптографически защищённая верификация дипломов. Доверие — основа платформы.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-[#a05c20]" strokeWidth={1.5} />
              <span className="text-[#1c1917] font-bold tracking-widest">VERITAS</span>
            </div>
            <Link href="/" className="flex items-center gap-1.5 text-stone-400 hover:text-[#a05c20] text-xs transition-colors group">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              На главную
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-[#1c1917] mb-1">Вход</h2>

          {notice && (
            <div className={`flex items-start gap-2 text-sm rounded-md px-3 py-2.5 mb-4 ${
              notice.type === "success" ? "bg-green-50 border border-green-200 text-green-800" :
              notice.type === "warning" ? "bg-amber-50 border border-amber-200 text-amber-800" :
              "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {notice.type === "success" ? <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> :
               notice.type === "warning" ? <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" /> :
               <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
              {notice.text}
            </div>
          )}

          <p className="text-stone-500 text-sm mb-8">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-[#a05c20] hover:underline font-medium">
              Зарегистрироваться
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[#1c1917] font-medium text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#1c1917] font-medium text-sm">Пароль</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-9" required minLength={8} />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading}
              className="w-full bg-[#1c1917] hover:bg-[#2a2622] text-[#f0d4a0] font-semibold tracking-wide">
              {loading ? "Вход..." : "Войти"}
            </Button>

            <p className="text-center text-xs text-stone-400">
              <Link href="/register/university" className="hover:text-[#a05c20]">
                Зарегистрировать учебное заведение
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

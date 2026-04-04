"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Search, ArrowRight, Copy, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";

export default function VerifyManualPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  function copyEndpoint() {
    navigator.clipboard.writeText("GET /api/v1/employer/verify/{token}\nAuthorization: Bearer <api_key>");
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = token.trim();
    if (!t) { setError("Введите токен верификации"); return; }
    // UUID validation (loose)
    const uuidLike = /^[0-9a-f-]{32,36}$/i.test(t.replace(/-/g, "")) || t.length > 10;
    if (!uuidLike) { setError("Некорректный формат токена"); return; }
    router.push(`/v/${encodeURIComponent(t)}`);
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Shield className="h-16 w-16 text-[#a05c20]" strokeWidth={1} />
              <span className="absolute inset-0 flex items-center justify-center text-[#1c1917] font-black text-xl">V</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#1c1917] text-center mb-2">
            Проверить диплом
          </h1>
          <p className="text-stone-500 text-sm text-center mb-8 leading-relaxed">
            Введите токен верификации из QR-кода или ссылки.<br />
            Регистрация не требуется.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Токен верификации (UUID)"
                value={token}
                onChange={(e) => { setToken(e.target.value); setError(""); }}
                className="font-mono text-sm h-12 text-center tracking-wider"
                autoFocus
              />
              {error && (
                <p className="text-xs text-red-600 mt-1.5 text-center">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-[#1c1917] hover:bg-[#2a2622] text-[#f0d4a0] font-semibold text-sm"
            >
              <Search className="h-4 w-4 mr-2" />
              Проверить подлинность
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-8">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs text-stone-400 font-medium">или</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          {/* Info block */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Для работодателей и HR</p>
            <p className="text-sm text-stone-600 leading-relaxed">
              Для автоматической проверки дипломов в вашей HR-системе или ATS используйте открытый API VERITAS.
            </p>
            <div className="relative group bg-stone-50 rounded-md p-3 font-mono text-xs text-stone-600 break-all">
              GET /api/v1/employer/verify/&#123;token&#125;<br />
              Authorization: Bearer &lt;api_key&gt;
              <button
                onClick={copyEndpoint}
                className="absolute top-2 right-2 p-1 rounded text-stone-400 hover:text-[#a05c20] transition-colors opacity-0 group-hover:opacity-100"
                title="Скопировать"
              >
                {copiedEndpoint ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <Link
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200"}/docs#/Employer%20API`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#a05c20] text-sm font-medium hover:underline"
            >
              Документация API
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <p className="text-center text-xs text-stone-400 mt-6">
            Результат верификации фиксируется в иммутабельном журнале платформы
          </p>
        </div>
      </div>
    </div>
  );
}

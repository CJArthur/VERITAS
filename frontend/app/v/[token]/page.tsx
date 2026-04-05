import type { Metadata } from "next";
import { VerifyResult } from "@/components/VerifyResult";
import { Shield, ShieldAlert, FileX, Clock, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { token: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Верификация ${params.token.slice(0, 8)}… — VERITAS`,
    robots: { index: false },
  };
}

async function fetchDiploma(token: string) {
  const apiUrl = process.env.API_URL || "http://localhost:8200";
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/public/diplomas/${token}`,
      { cache: "no-store" }
    );
    if (res.status === 404) return { type: "not_found" as const };
    if (res.status === 403) return { type: "no_access" as const };
    if (res.status === 410) {
      const body = await res.json().catch(() => ({}));
      return { type: "expired" as const, detail: body.detail as string };
    }
    if (!res.ok) return { type: "error" as const };
    const data = await res.json();
    return { type: "ok" as const, data };
  } catch {
    return { type: "error" as const };
  }
}

const ERROR_STYLES = {
  not_found:  { bg: "from-[#1c1917] to-[#2a1a10]", accent: "#a05c20", iconColor: "text-[#a05c20]" },
  no_access:  { bg: "from-[#1a1a2e] to-[#16213e]", accent: "#6366f1", iconColor: "text-indigo-400" },
  expired:    { bg: "from-[#1a1208] to-[#2a1e04]", accent: "#d97706", iconColor: "text-amber-400" },
  error:      { bg: "from-[#1c1917] to-[#1c1917]", accent: "#57534e", iconColor: "text-stone-400" },
};

function ErrorScreen({
  icon: Icon,
  title,
  detail,
  variant = "not_found",
}: {
  icon: React.ElementType;
  title: string;
  detail?: string;
  variant?: keyof typeof ERROR_STYLES;
}) {
  const style = ERROR_STYLES[variant];
  return (
    <div className={`min-h-screen bg-gradient-to-br ${style.bg} flex flex-col`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-6 h-6">
            <Shield className="w-6 h-6" style={{ color: style.accent }} strokeWidth={1.5} />
            <span className="absolute inset-0 flex items-center justify-center text-[#f0d4a0] font-black text-[10px]">V</span>
          </div>
          <span className="text-[#f0d4a0] font-black tracking-[0.2em] text-sm">VERITAS</span>
        </Link>
        <Link href="/verify" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors group">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Ввести токен вручную
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Icon className={`h-10 w-10 ${style.iconColor}`} strokeWidth={1.2} />
          </div>
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">{title}</h1>
          {detail && <p className="text-white/50 text-sm leading-relaxed mb-8">{detail}</p>}
          <div className="h-px w-16 mx-auto mb-6" style={{ backgroundColor: style.accent + "60" }} />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-xs transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            На главную VERITAS
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function VerifyPage({ params }: PageProps) {
  const result = await fetchDiploma(params.token);

  if (result.type === "not_found") {
    return (
      <ErrorScreen
        icon={FileX}
        variant="not_found"
        title="Диплом не найден"
        detail="Токен верификации не существует или недействителен."
      />
    );
  }

  if (result.type === "no_access") {
    return (
      <ErrorScreen
        icon={ShieldAlert}
        variant="no_access"
        title="Доступ не открыт"
        detail="Выпускник ещё не открыл доступ к этому диплому. Обратитесь к нему напрямую."
      />
    );
  }

  if (result.type === "expired") {
    return (
      <ErrorScreen
        icon={Clock}
        variant="expired"
        title="Срок действия ссылки истёк"
        detail={result.detail || "Попросите выпускника создать новую ссылку."}
      />
    );
  }

  if (result.type === "error") {
    return (
      <ErrorScreen
        icon={RefreshCw}
        variant="error"
        title="Ошибка проверки"
        detail="Не удалось получить данные. Попробуйте обновить страницу."
      />
    );
  }

  return (
    <VerifyResult data={result.data} checkedAt={new Date().toISOString()} />
  );
}

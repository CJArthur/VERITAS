import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ShieldX, CheckCircle2, XCircle, AlertTriangle, Eye, Shield, ArrowLeft, User, GraduationCap, Award } from "lucide-react";
import { PublicDiplomaView, DOCUMENT_TYPE_LABEL } from "@/lib/api";

interface VerifyResultProps {
  data: PublicDiplomaView;
  checkedAt: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/Moscow",
  });
}

export function VerifyResult({ data, checkedAt }: VerifyResultProps) {
  const isValid = data.status === "active";
  const docLabel = DOCUMENT_TYPE_LABEL[data.document_type] ?? "Документ";
  const DocIcon = data.document_type === "certificate"
    ? Award
    : data.document_type === "professional_license"
    ? Shield
    : GraduationCap;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className={`flex items-center justify-between px-5 py-3.5 border-b ${isValid ? "bg-emerald-950 border-emerald-800" : "bg-red-950 border-red-900"}`}>
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-6 h-6">
            <Shield className="w-6 h-6 text-[#a05c20]" strokeWidth={1.5} />
            <span className="absolute inset-0 flex items-center justify-center text-[#f0d4a0] font-black text-[10px]">V</span>
          </div>
          <span className="text-[#f0d4a0] font-black tracking-[0.2em] text-sm">VERITAS</span>
        </Link>
        <Link href="/verify" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors group">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Проверить другой диплом
        </Link>
      </div>

      {/* STATUS BAND */}
      <div className={`${isValid ? "verify-valid" : "verify-invalid"} px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center text-center relative overflow-hidden`}>
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />

        <div className="relative z-10 flex flex-col items-center">
          {isValid
            ? <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-white/90 mb-4" strokeWidth={1.2} />
            : <ShieldX className="h-12 w-12 sm:h-16 sm:w-16 text-white/90 mb-4" strokeWidth={1.2} />
          }
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
            {isValid
              ? `${docLabel.toUpperCase()} ПОДЛИННЫЙ`
              : `${docLabel.toUpperCase()} НЕДЕЙСТВИТЕЛЕН`}
          </h1>
          <p className="text-white/60 text-sm font-medium mb-5">
            Проверено {fmt(checkedAt)}
          </p>

          {/* Signature badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold border ${
            data.signature_valid
              ? "border-white/20 bg-white/10 text-white"
              : "border-red-300/40 bg-red-950/40 text-red-200"
          }`}>
            {data.signature_valid
              ? <CheckCircle2 className="h-3.5 w-3.5" />
              : <XCircle className="h-3.5 w-3.5" />
            }
            {data.signature_valid
              ? "Криптографическая подпись ВУЗа верна"
              : "Подпись не соответствует данным"
            }
          </div>

          {/* Verification count — social proof */}
          {data.verification_count > 1 && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-white/40 text-xs">
              <Eye className="h-3.5 w-3.5" />
              Проверено {data.verification_count} {data.verification_count === 1 ? "раз" : data.verification_count < 5 ? "раза" : "раз"}
            </div>
          )}
        </div>
      </div>

      {/* DIPLOMA DATA */}
      <div className="flex-1 bg-[#faf9f7]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">

          {!isValid && (
            <div className="flex items-start gap-3 border border-red-200 bg-white px-5 py-4 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800 text-sm">Документ не может служить подтверждением образования</p>
                <p className="text-red-600 text-sm mt-0.5">
                  Статус: {data.status === "revoked" ? "аннулирован учебным заведением" : data.status === "suspended" ? "приостановлен" : data.status}
                </p>
              </div>
            </div>
          )}

          {/* Recipient notice — shown when student shared specifically for this viewer */}
          {data.share_recipient && isValid && (
            <div className="flex items-center gap-3 bg-white border border-[#a05c20]/20 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-[#a05c20]/10 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-[#a05c20]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-stone-400 font-medium">Доступ открыт персонально для</p>
                <p className="font-semibold text-[#1c1917] text-sm">{data.share_recipient}</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-stone-200 overflow-hidden rounded-xl shadow-sm">
            {/* University header with logo */}
            <div className="bg-[#1c1917] px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/10 relative">
                {data.university_avatar_url ? (
                  <Image
                    src={data.university_avatar_url}
                    alt={data.university_name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <DocIcon className="h-5 w-5 text-[#a05c20]" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-[#a05c20] mb-0.5">
                  {data.document_type === "diploma" ? "Учебное заведение" : "Выдан организацией"}
                </p>
                <p className="text-[#f0d4a0] font-semibold text-sm leading-tight truncate">
                  {data.issuer_name ?? data.university_name}
                </p>
              </div>
              <span className="text-[#a05c20]/60 text-[10px] font-mono hidden sm:block">
                #{data.registration_number}
              </span>
            </div>

            {/* Graduate name — hero row */}
            <div className="px-6 py-5 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
              <p className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold mb-1">Выпускник</p>
              <p className="text-2xl font-bold text-[#1c1917] leading-tight">
                {data.graduate_full_name}
              </p>
            </div>

            <div className="divide-y divide-stone-100">
              {[
                { label: "Направление подготовки", value: data.specialty_name },
                { label: "Год окончания", value: String(data.study_end_year) },
                { label: "Регистрационный номер", value: data.registration_number },
                ...(data.employer_link_valid_until
                  ? [{ label: "Ссылка действительна до", value: fmt(data.employer_link_valid_until) }]
                  : []),
              ].map((row) => (
                <div key={row.label} className="flex flex-col sm:grid sm:grid-cols-[200px_1fr] px-5 sm:px-6 py-3">
                  <span className="text-[11px] text-stone-400 font-medium mb-0.5 sm:mb-0 sm:pt-0.5 uppercase tracking-wider">{row.label}</span>
                  <span className="text-sm font-semibold text-[#1c1917]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {data.blockchain_status && data.blockchain_status !== "not_configured" && (
            <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-stone-500 text-sm font-medium">Блокчейн</span>
              </div>
              {data.blockchain_status === "anchored" && (
                <div className="flex items-center gap-2 text-green-700">
                  <span className="text-lg">✅</span>
                  <div>
                    <div className="font-medium text-sm">Anchored · Sepolia Testnet</div>
                    {data.blockchain_anchored_at && (
                      <div className="text-xs text-stone-500">
                        {new Date(data.blockchain_anchored_at).toLocaleDateString("ru-RU")}
                      </div>
                    )}
                    {data.blockchain_tx_hash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${data.blockchain_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Посмотреть в Etherscan →
                      </a>
                    )}
                  </div>
                </div>
              )}
              {data.blockchain_status === "pending" && (
                <div className="text-stone-500 text-sm">
                  ⏳ Запись в блокчейн в процессе...
                </div>
              )}
              {data.blockchain_status === "mismatch" && (
                <div className="text-red-600 text-sm font-medium">
                  ⚠️ Несоответствие блокчейн-записи
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-stone-400 pt-2">
            <span>Результат зафиксирован в иммутабельном журнале платформы</span>
            <span className="font-semibold text-[#a05c20] tracking-widest">VERITAS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

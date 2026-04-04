import { ShieldCheck, ShieldX, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { PublicDiplomaView } from "@/lib/api";

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

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* STATUS BAND */}
      <div className={`${isValid ? "verify-valid" : "verify-invalid"} px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center text-center`}>
        {isValid
          ? <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-white/90 mb-4" strokeWidth={1.2} />
          : <ShieldX className="h-12 w-12 sm:h-16 sm:w-16 text-white/90 mb-4" strokeWidth={1.2} />
        }
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
          {isValid ? "ДИПЛОМ ПОДЛИННЫЙ" : "ДИПЛОМ НЕДЕЙСТВИТЕЛЕН"}
        </h1>
        <p className="text-white/60 text-sm font-medium">
          Проверено {fmt(checkedAt)}
        </p>

        {/* Signature badge */}
        <div className={`mt-5 inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold border ${
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
            : "Подпись не соответствует данным — возможно изменение записи"
          }
        </div>
      </div>

      {/* DIPLOMA DATA */}
      <div className="flex-1 bg-[#faf9f7]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">

          {!isValid && (
            <div className="flex items-start gap-3 border border-red-200 bg-white px-5 py-4 rounded">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800 text-sm">Документ не может служить подтверждением образования</p>
                <p className="text-red-600 text-sm mt-0.5">
                  Статус: {data.status === "revoked" ? "аннулирован учебным заведением" : data.status === "suspended" ? "приостановлен" : data.status}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white border border-stone-200 overflow-hidden">
            <div className="bg-[#1c1917] px-6 py-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[#a05c20]">
                Сведения о документе об образовании
              </span>
              <span className="text-[#f0d4a0] text-[11px] font-mono">
                #{data.registration_number}
              </span>
            </div>

            <div className="px-6 py-5 border-b border-stone-100">
              <p className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold mb-1">Выпускник</p>
              <p className="text-2xl font-bold text-[#1c1917] leading-tight">
                {data.graduate_full_name}
              </p>
            </div>

            <div className="divide-y divide-stone-100">
              {[
                { label: "Учебное заведение", value: data.university_name },
                { label: "Направление подготовки", value: data.specialty_name },
                { label: "Год окончания", value: String(data.study_end_year) },
                ...(data.employer_link_valid_until
                  ? [{ label: "Ссылка действительна до", value: fmt(data.employer_link_valid_until) }]
                  : []),
              ].map((row) => (
                <div key={row.label} className="flex flex-col sm:grid sm:grid-cols-[180px_1fr] px-4 sm:px-6 py-3">
                  <span className="text-[11px] text-stone-400 font-medium mb-0.5 sm:mb-0 sm:pt-0.5 uppercase tracking-wider">{row.label}</span>
                  <span className="text-sm font-semibold text-[#1c1917]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-stone-400 pt-2">
            <span>Результат зафиксирован в иммутабельном журнале платформы</span>
            <span className="font-semibold text-[#a05c20] tracking-widest">VERITAS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

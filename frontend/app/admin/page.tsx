import { cookies } from "next/headers";
import Image from "next/image";
import { ShieldAlert, Building2, GraduationCap, CheckCircle, XCircle, Clock, BarChart3 } from "lucide-react";
import { apiGet, PendingUniversity, AdminUniversityItem, AdminStats } from "@/lib/api";
import { AdminUniversityCard } from "@/components/AdminUniversityCard";
import { ApiKeyManager } from "@/components/ApiKeyManager";

export const dynamic = "force-dynamic";

const STATUS_CONFIG = {
  approved: { label: "Одобрен", color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: CheckCircle },
  rejected: { label: "Отклонён", color: "text-red-500", bg: "bg-red-50", border: "border-red-200", icon: XCircle },
  pending:  { label: "На рассмотрении", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  let pending: PendingUniversity[] = [];
  let allUniversities: AdminUniversityItem[] = [];
  let stats: AdminStats | null = null;

  if (token) {
    try {
      pending = await apiGet<PendingUniversity[]>("/api/v1/admin/universities/pending", `access_token=${token}`);
    } catch {}
    try {
      allUniversities = await apiGet<AdminUniversityItem[]>("/api/v1/admin/universities", `access_token=${token}`);
    } catch {}
    try {
      stats = await apiGet<AdminStats>("/api/v1/admin/stats", `access_token=${token}`);
    } catch {}
  }


  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1c1917]">Администрирование</h1>
        <p className="text-stone-500 text-sm mt-1">Управление платформой VERITAS</p>
      </div>

      {/* Platform stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-10">
          {[
            { icon: Building2,    label: "ВУЗов всего",       value: stats.total_universities,    color: "text-[#a05c20]", bg: "bg-[#a05c20]/10", border: "border-[#a05c20]/20" },
            { icon: CheckCircle,  label: "ВУЗов одобрено",    value: stats.approved_universities, color: "text-green-600", bg: "bg-green-50",      border: "border-green-200" },
            { icon: GraduationCap,label: "Дипломов",           value: stats.total_diplomas,        color: "text-indigo-500",bg: "bg-indigo-50",     border: "border-indigo-200" },
            { icon: BarChart3,    label: "Проверок",           value: stats.total_verifications,   color: "text-stone-500", bg: "bg-stone-100",     border: "border-stone-200" },
          ].map((s) => (
            <div key={s.label} className={`bg-white border ${s.border} rounded-lg px-4 py-3 flex items-center gap-3`}>
              <div className={`w-9 h-9 rounded-md ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`h-4 w-4 ${s.color}`} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-black text-[#1c1917] leading-none">{s.value}</p>
                <p className="text-stone-400 text-xs mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending section */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <ShieldAlert className="h-5 w-5 text-[#a05c20]" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-[#1c1917]">Заявки на рассмотрении</h2>
          {pending.length > 0 && (
            <span className="bg-[#a05c20] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-stone-200">
            <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-stone-500 font-medium">Нет заявок на рассмотрении</p>
            <p className="text-stone-400 text-sm mt-1">Все заявки обработаны</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map((uni) => (
              <AdminUniversityCard key={uni.id} university={uni} />
            ))}
          </div>
        )}
      </section>

      {/* All universities */}
      {allUniversities.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <Building2 className="h-5 w-5 text-stone-400" strokeWidth={1.5} />
            <h2 className="text-lg font-semibold text-[#1c1917]">Все учебные заведения</h2>
            <span className="text-stone-400 text-sm">({allUniversities.length})</span>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
            {allUniversities.map((uni) => {
              const cfg = STATUS_CONFIG[uni.approval_status];
              const StatusIcon = cfg.icon;
              return (
                <div key={uni.id} className="flex items-center gap-4 px-5 py-3.5">
                  {uni.avatar_url ? (
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <Image src={uni.avatar_url} alt={uni.name} fill className="object-cover" sizes="36px" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-stone-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1c1917] text-sm truncate">{uni.name}</p>
                    <p className="text-xs text-stone-400 font-mono">{uni.ogrn}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-xs text-stone-400">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {uni.diploma_count}
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    <StatusIcon className="h-3.5 w-3.5" strokeWidth={2} />
                    {cfg.label}
                  </div>
                  {uni.rejection_reason && (
                    <p className="hidden lg:block text-xs text-red-400 truncate max-w-[200px]">{uni.rejection_reason}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* API Keys section */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#1c1917]">API-ключи для работодателей</h2>
          <p className="text-stone-500 text-sm mt-1">
            Выдаются HR-системам и корпоративным клиентам для автоматической верификации
          </p>
        </div>
        <ApiKeyManager />
      </section>
    </div>
  );
}

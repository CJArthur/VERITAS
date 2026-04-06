"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  GraduationCap,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { apiGet } from "@/lib/api";

interface DailyCount {
  date: string;
  count: number;
}

interface TopVerifier {
  org_name: string;
  count: number;
}

interface TopDiploma {
  name: string;
  specialty: string;
  count: number;
}

interface ActivityItem {
  verifier_org: string | null;
  verifier_type: string;
  result: string;
  verified_at: string;
}

interface AnalyticsData {
  total_verifications: number;
  this_week: number;
  last_week: number;
  growth_percent: number | null;
  daily_counts: DailyCount[];
  top_verifiers: TopVerifier[];
  top_diplomas: TopDiploma[];
  recent_activity: ActivityItem[];
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

function BarChart({ data }: { data: DailyCount[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  // Show every 5th label to avoid crowding
  return (
    <div className="flex items-end gap-[2px] h-24 w-full">
      {data.map((d, i) => {
        const pct = (d.count / max) * 100;
        const showLabel = i === 0 || i === data.length - 1 || i % 7 === 0;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-[#1c1917] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {fmtDate(d.date)}: {d.count}
            </div>
            <div className="w-full flex items-end" style={{ height: "80px" }}>
              <div
                className={`w-full rounded-t transition-all ${d.count > 0 ? "bg-[#a05c20]" : "bg-stone-100"}`}
                style={{ height: `${Math.max(pct, d.count > 0 ? 8 : 2)}%` }}
              />
            </div>
            {showLabel && (
              <span className="text-[8px] text-stone-400 leading-none">
                {new Date(d.date).toLocaleDateString("ru-RU", { day: "numeric", month: "numeric" })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GrowthBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-stone-400 text-sm">нет данных</span>;
  if (pct > 0)
    return (
      <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
        <TrendingUp className="h-4 w-4" />+{pct}%
      </span>
    );
  if (pct < 0)
    return (
      <span className="flex items-center gap-1 text-red-500 text-sm font-semibold">
        <TrendingDown className="h-4 w-4" />{pct}%
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-stone-400 text-sm font-semibold">
      <Minus className="h-4 w-4" />0%
    </span>
  );
}

function ActivityIcon({ type, result }: { type: string; result: string }) {
  const ok = result === "ok";
  if (type === "employer_api")
    return (
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? "bg-green-50" : "bg-red-50"}`}>
        <Building2 className={`h-3.5 w-3.5 ${ok ? "text-green-600" : "text-red-500"}`} strokeWidth={2} />
      </div>
    );
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? "bg-stone-100" : "bg-red-50"}`}>
      <Eye className={`h-3.5 w-3.5 ${ok ? "text-stone-500" : "text-red-500"}`} strokeWidth={2} />
    </div>
  );
}

export default function IssuerAnalyticsPage() {
  const { data, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ["issuer-analytics"],
    queryFn: () => apiGet<AnalyticsData>("/api/v1/issuer/analytics"),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 border-2 border-[#a05c20] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-20 text-stone-400">
        <BarChart3 className="h-10 w-10 mx-auto mb-3" strokeWidth={1.5} />
        <p className="font-medium">Не удалось загрузить аналитику</p>
      </div>
    );
  }

  const isEmpty = data.total_verifications === 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1c1917]">Аналитика</h1>
        <p className="text-stone-500 text-sm mt-1">
          Активность проверки дипломов вашего учебного заведения
        </p>
      </div>

      {isEmpty ? (
        <div className="text-center py-20 bg-white rounded-xl border border-stone-200">
          <BarChart3 className="h-14 w-14 text-stone-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-stone-500 font-medium">Пока нет данных</p>
          <p className="text-stone-400 text-sm mt-1 max-w-sm mx-auto">
            Как только работодатели начнут проверять дипломы выпускников, здесь появится статистика
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Всего проверок", value: data.total_verifications, icon: Eye, color: "text-[#a05c20]", bg: "bg-[#a05c20]/10", border: "border-[#a05c20]/20" },
              { label: "За эту неделю",  value: data.this_week,            icon: BarChart3, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-200" },
              { label: "За прошлую неделю", value: data.last_week,         icon: Clock, color: "text-stone-500", bg: "bg-stone-100", border: "border-stone-200" },
              { label: "Динамика",        value: null,                      icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", custom: <GrowthBadge pct={data.growth_percent} /> },
            ].map((s) => (
              <div key={s.label} className={`bg-white border ${s.border} rounded-xl px-4 py-3 flex items-center gap-3`}>
                <div className={`w-9 h-9 rounded-md ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} strokeWidth={1.5} />
                </div>
                <div>
                  {s.custom ?? (
                    <p className="text-2xl font-black text-[#1c1917] leading-none">{s.value}</p>
                  )}
                  <p className="text-stone-400 text-xs mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-[#1c1917] text-sm">Активность за 30 дней</h2>
                <p className="text-stone-400 text-xs mt-0.5">Количество верификаций по дням</p>
              </div>
              <span className="text-xs text-stone-400 font-mono">{data.daily_counts.at(-1)?.date}</span>
            </div>
            <BarChart data={data.daily_counts} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top verifying organizations */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <Building2 className="h-4 w-4 text-[#a05c20]" strokeWidth={1.5} />
                <h2 className="font-semibold text-[#1c1917] text-sm">Топ работодателей</h2>
              </div>
              {data.top_verifiers.length === 0 ? (
                <p className="text-stone-400 text-sm text-center py-6">
                  Нет проверок через API-ключи
                </p>
              ) : (
                <div className="space-y-3">
                  {data.top_verifiers.map((v, i) => {
                    const maxCount = data.top_verifiers[0].count;
                    return (
                      <div key={v.org_name} className="flex items-center gap-3">
                        <span className="text-stone-400 text-xs w-4 font-mono">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[#1c1917] truncate">{v.org_name}</span>
                            <span className="text-xs font-bold text-[#a05c20] ml-2 flex-shrink-0">{v.count}</span>
                          </div>
                          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#a05c20] rounded-full transition-all"
                              style={{ width: `${(v.count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Most verified graduates */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <GraduationCap className="h-4 w-4 text-[#a05c20]" strokeWidth={1.5} />
                <h2 className="font-semibold text-[#1c1917] text-sm">Востребованные выпускники</h2>
              </div>
              {data.top_diplomas.length === 0 ? (
                <p className="text-stone-400 text-sm text-center py-6">Нет данных</p>
              ) : (
                <div className="space-y-2">
                  {data.top_diplomas.map((d, i) => (
                    <div key={i} className="flex items-start gap-3 py-1.5 border-b border-stone-50 last:border-0">
                      <span className="text-stone-300 text-xs font-mono w-4 pt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1c1917] truncate">{d.name}</p>
                        <p className="text-xs text-stone-400 truncate">{d.specialty}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-stone-400 flex-shrink-0">
                        <Eye className="h-3 w-3" />
                        {d.count}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent activity feed */}
          {data.recent_activity.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <Clock className="h-4 w-4 text-[#a05c20]" strokeWidth={1.5} />
                <h2 className="font-semibold text-[#1c1917] text-sm">Последние проверки</h2>
              </div>
              <div className="divide-y divide-stone-50">
                {data.recent_activity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <ActivityIcon type={a.verifier_type} result={a.result} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1c1917] truncate">
                        {a.verifier_org ?? (a.verifier_type === "employer_api" ? "Работодатель" : "Публичная ссылка")}
                      </p>
                      <p className="text-xs text-stone-400">{fmt(a.verified_at)}</p>
                    </div>
                    {a.result === "ok" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

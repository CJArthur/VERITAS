import { cookies } from "next/headers";
import { GraduationCap, ShieldCheck, XCircle, UserCheck } from "lucide-react";
import { apiGet, DiplomaListItem } from "@/lib/api";
import { DiplomaTable } from "@/components/DiplomaTable";

export const dynamic = "force-dynamic";

export default async function UniversityPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  let diplomas: DiplomaListItem[] = [];
  if (token) {
    try {
      diplomas = await apiGet<DiplomaListItem[]>("/api/v1/university/diplomas", `access_token=${token}`);
    } catch {}
  }

  const active  = diplomas.filter((d) => d.status === "active").length;
  const revoked = diplomas.filter((d) => d.status === "revoked").length;
  const claimed = diplomas.filter((d) => d.student_user_id).length;

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1917]">Дипломы</h1>
          <p className="text-stone-500 text-sm mt-1">Управление дипломами учебного заведения</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-8">
        {[
          { icon: GraduationCap, label: "Всего",       value: diplomas.length, color: "text-[#a05c20]", bg: "bg-[#a05c20]/10", border: "border-[#a05c20]/20" },
          { icon: ShieldCheck,   label: "Активных",    value: active,          color: "text-green-600", bg: "bg-green-50",      border: "border-green-200" },
          { icon: XCircle,       label: "Отозванных",  value: revoked,         color: "text-red-500",   bg: "bg-red-50",        border: "border-red-200" },
          { icon: UserCheck,     label: "Привязано",   value: claimed,         color: "text-indigo-500",bg: "bg-indigo-50",     border: "border-indigo-200" },
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

      <DiplomaTable initial={diplomas} />
    </div>
  );
}

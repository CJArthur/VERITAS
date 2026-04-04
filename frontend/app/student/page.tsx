import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, GraduationCap, ShieldCheck, Clock, XCircle } from "lucide-react";
import { apiGet, StudentDiploma } from "@/lib/api";
import { DiplomaCard } from "@/components/DiplomaCard";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/login");

  let diplomas: StudentDiploma[] = [];
  try {
    diplomas = await apiGet<StudentDiploma[]>("/api/v1/student/diplomas", `access_token=${token}`);
  } catch {}

  const active = diplomas.filter((d) => d.status === "active").length;
  const revoked = diplomas.filter((d) => d.status === "revoked").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1917]">Мои дипломы</h1>
          <p className="text-stone-500 text-sm mt-1">Управляйте дипломами и ссылками для работодателей</p>
        </div>
        <Button asChild className="bg-[#1c1917] text-[#f0d4a0] hover:bg-[#2a2622]">
          <Link href="/student/claim">
            <PlusCircle className="h-4 w-4 mr-2" />
            Привязать диплом
          </Link>
        </Button>
      </div>

      {diplomas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-8">
          {[
            { icon: GraduationCap, label: "Всего", value: diplomas.length, color: "text-[#a05c20]", bg: "bg-[#a05c20]/10" },
            { icon: ShieldCheck,   label: "Активных", value: active,  color: "text-green-600", bg: "bg-green-50" },
            { icon: XCircle,       label: "Отозванных", value: revoked, color: "text-red-500",  bg: "bg-red-50" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-stone-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-md ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`h-4 w-4 ${s.color}`} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xl font-black text-[#1c1917] leading-none">{s.value}</p>
                <p className="text-stone-400 text-xs mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {diplomas.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-stone-200">
          <GraduationCap className="h-14 w-14 text-stone-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-stone-500 font-medium">Дипломы не найдены</p>
          <p className="text-stone-400 text-sm mt-1 mb-6">
            Привяжите диплом, выданный вашим учебным заведением
          </p>
          <Button asChild variant="outline">
            <Link href="/student/claim">Привязать диплом</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {diplomas.map((d) => (
            <DiplomaCard key={d.id} diploma={d} />
          ))}
        </div>
      )}
    </div>
  );
}

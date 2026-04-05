import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { apiGet, PendingUniversity } from "@/lib/api";
import { AdminUniversityCard } from "@/components/AdminUniversityCard";
import { ApiKeyManager } from "@/components/ApiKeyManager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/login");

  let pending: PendingUniversity[] = [];
  try {
    pending = await apiGet<PendingUniversity[]>("/api/v1/admin/universities/pending", `access_token=${token}`);
  } catch {}

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1c1917]">Администрирование</h1>
        <p className="text-stone-500 text-sm mt-1">Управление платформой VERITAS</p>
      </div>

      {/* Universities section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-semibold text-[#1c1917]">Заявки учебных заведений</h2>
          {pending.length > 0 && (
            <span className="bg-[#a05c20] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <ShieldAlert className="h-12 w-12 text-stone-300 mx-auto mb-3" strokeWidth={1.5} />
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

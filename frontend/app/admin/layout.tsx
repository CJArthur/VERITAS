import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { apiGet, UserMe } from "@/lib/api";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/login");
  let user: UserMe | null = null;
  try {
    user = await apiGet<UserMe>("/api/v1/me", `access_token=${token}`);
  } catch {
    // ignore — redirect below
  }
  if (!user || user.role !== "super_admin") redirect("/login");
  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <Navbar role="super_admin" />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

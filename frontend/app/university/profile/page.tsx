"use client";

import { useEffect, useState } from "react";
import { Building2, Save, CheckCircle } from "lucide-react";
import { ApiError } from "@/lib/api";
import { CloudinaryUpload } from "@/components/CloudinaryUpload";
import { Button } from "@/components/ui/button";

interface UniversityInfo {
  id: string;
  name: string;
  ogrn: string;
  license_number: string;
  accreditation_number: string;
  avatar_url?: string | null;
  banner_url?: string | null;
  approval_status: string;
}

export default function UniversityProfilePage() {
  const [profile, setProfile] = useState<UniversityInfo | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

  useEffect(() => {
    fetch(`${apiUrl}/api/v1/university/profile`, { credentials: "include" })
      .then((r) => r.json())
      .then((p) => {
        setProfile(p);
        setAvatarUrl(p.avatar_url);
        setBannerUrl(p.banner_url);
      });
  }, []);

  async function handleSave() {
    setSaving(true); setError("");
    try {
      const res = await fetch(`${apiUrl}/api/v1/university/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: avatarUrl, banner_url: bannerUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body.detail || "Ошибка");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-[#a05c20] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1c1917]">Профиль учебного заведения</h1>
        <p className="text-stone-500 text-sm mt-1">Информация отображается на публичных страницах</p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <Building2 className="h-5 w-5 text-[#a05c20]" />
          <h2 className="font-semibold text-[#1c1917]">Реквизиты</h2>
        </div>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          {[
            { label: "Полное название", value: profile.name },
            { label: "ОГРН", value: profile.ogrn },
            { label: "Номер лицензии", value: profile.license_number },
            { label: "Аккредитация", value: profile.accreditation_number },
          ].map((r) => (
            <div key={r.label}>
              <p className="text-xs text-stone-400 mb-0.5">{r.label}</p>
              <p className="font-medium text-[#1c1917]">{r.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-6">
        <h2 className="font-semibold text-[#1c1917]">Медиа</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <p className="text-sm font-medium text-[#1c1917] mb-2">Логотип / Аватар</p>
            <CloudinaryUpload currentUrl={avatarUrl} label="Загрузить логотип"
              folder="veritas/avatars" onUploaded={(url) => setAvatarUrl(url)}
              aspectClass="aspect-square max-w-[160px]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#1c1917] mb-2">Баннер</p>
            <CloudinaryUpload currentUrl={bannerUrl} label="Загрузить баннер"
              folder="veritas/banners" onUploaded={(url) => setBannerUrl(url)}
              aspectClass="aspect-[3/1]" />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={handleSave} disabled={saving}
          className="bg-[#1c1917] text-[#f0d4a0] hover:bg-[#2a2622]">
          {saved ? (
            <><CheckCircle className="h-4 w-4 mr-2" />Сохранено</>
          ) : saving ? "Сохранение..." : (
            <><Save className="h-4 w-4 mr-2" />Сохранить изменения</>
          )}
        </Button>
      </div>
    </div>
  );
}

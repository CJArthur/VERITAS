"use client";

import { useState } from "react";
import { GraduationCap, Building2, Calendar, QrCode, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ShareLinkDialog } from "@/components/ShareLinkDialog";
import { StudentDiploma } from "@/lib/api";

interface DiplomaCardProps {
  diploma: StudentDiploma;
}

export function DiplomaCard({ diploma }: DiplomaCardProps) {
  const [shareOpen, setShareOpen] = useState(false);

  async function handleDownloadQr() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
    const res = await fetch(
      `${apiUrl}/api/v1/student/diplomas/${diploma.id}/qr.png`,
      { credentials: "include" }
    );
    if (!res.ok) {
      alert("Сначала создайте ссылку для работодателя");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veritas-qr-${diploma.registration_number}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="px-5 py-4 bg-[#1c1917] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#a05c20] flex-shrink-0" />
            <span className="text-[#f0d4a0] text-sm font-medium truncate">
              {diploma.university_name ?? "Учебное заведение"}
            </span>
          </div>
          <StatusBadge status={diploma.status as "active" | "revoked" | "suspended"} />
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start gap-2">
            <GraduationCap className="h-4 w-4 text-[#a05c20] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Специальность</p>
              <p className="font-semibold text-[#1c1917] text-sm">{diploma.specialty_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#a05c20] flex-shrink-0" />
            <div>
              <p className="text-xs text-stone-400">Год окончания</p>
              <p className="font-medium text-[#1c1917] text-sm">{diploma.study_end_year}</p>
            </div>
          </div>
          <div className="text-xs text-stone-400 font-mono bg-stone-50 rounded px-2 py-1">
            {diploma.registration_number}
          </div>
        </div>

        {diploma.status === "active" && (
          <div className="px-5 pb-4 flex gap-2">
            <Button variant="outline" size="sm"
              className="flex-1 border-[#a05c20] text-[#a05c20] hover:bg-[#a05c20] hover:text-white"
              onClick={() => setShareOpen(true)}>
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              Поделиться
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleDownloadQr}>
              <QrCode className="h-3.5 w-3.5 mr-1.5" />
              QR-код
            </Button>
          </div>
        )}
      </div>

      <ShareLinkDialog diplomaId={diploma.id} open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}

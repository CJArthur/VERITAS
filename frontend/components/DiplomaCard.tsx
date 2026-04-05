"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  GraduationCap, Building2, Calendar, QrCode, Share2,
  Eye, Clock, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ShareLinkDialog } from "@/components/ShareLinkDialog";
import { StudentDiploma, DiplomaActivityItem, apiGet } from "@/lib/api";

interface DiplomaCardProps {
  diploma: StudentDiploma;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1)  return "только что";
  if (minutes < 60) return `${minutes} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days < 30)    return `${days} дн. назад`;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

/**
 * Named verifications (employer API with org_name) get individual rows with full detail.
 * Anonymous public-link verifications are collapsed into one summary count at the bottom.
 * This avoids a noisy feed of "Публичная ссылка · вчера" × 10 that carries no real signal.
 */
function ActivityFeed({
  items,
  shareRecipient,
  validUntil,
}: {
  items: DiplomaActivityItem[];
  shareRecipient: string | null;
  validUntil: string | null;
}) {
  const named   = items.filter((i) => i.verifier_org);
  const anon    = items.filter((i) => !i.verifier_org);

  return (
    <div className="divide-y divide-stone-50">
      {/* Named employer verifications */}
      {named.map((item, i) => (
        <div key={i} className="flex items-center gap-2.5 py-2 first:pt-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.result === "ok" ? "bg-green-50" : "bg-red-50"}`}>
            <Building2 className={`h-3 w-3 ${item.result === "ok" ? "text-green-600" : "text-red-500"}`} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1c1917] truncate">{item.verifier_org}</p>
            <p className="text-[10px] text-stone-400">{timeAgo(item.verified_at)}</p>
          </div>
          {item.result === "ok"
            ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
            : <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
          }
        </div>
      ))}

      {/* Anonymous verifications — grouped */}
      {anon.length > 0 && (
        <div className="flex items-center gap-2.5 py-2">
          <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
            <Eye className="h-3 w-3 text-stone-400" strokeWidth={2} />
          </div>
          <p className="text-xs text-stone-400 flex-1">
            {anon.length === 1
              ? "1 анонимный просмотр"
              : `${anon.length} анонимных просмотра`}
            {anon[0] && (
              <span className="ml-1">· {timeAgo(anon[0].verified_at)}</span>
            )}
          </p>
        </div>
      )}

      {named.length === 0 && anon.length === 0 && (
        <p className="text-xs text-stone-400 py-3 text-center">Нет данных</p>
      )}

      {/* Active share info */}
      {validUntil && (
        <div className="pt-2 mt-1 flex items-center justify-between text-[10px] text-stone-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {shareRecipient ? (
              <span>Открыто для <span className="font-semibold text-[#a05c20]">{shareRecipient}</span></span>
            ) : (
              "Активная ссылка"
            )}
          </span>
          <span>
            до {new Date(validUntil).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
          </span>
        </div>
      )}
    </div>
  );
}

export function DiplomaCard({ diploma }: DiplomaCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [qrError, setQrError]     = useState("");
  const [activityOpen, setActivityOpen] = useState(false);

  const { data: activity, isFetching: activityLoading } = useQuery<DiplomaActivityItem[]>({
    queryKey: ["diploma-activity", diploma.id],
    queryFn: () => apiGet<DiplomaActivityItem[]>(`/api/v1/student/diplomas/${diploma.id}/activity`),
    enabled: activityOpen,
    staleTime: 30_000,
  });

  const qrMutation = useMutation({
    mutationFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8200";
      const res = await fetch(`${apiUrl}/api/v1/student/diplomas/${diploma.id}/qr.png`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("no_share");
      return res.blob();
    },
    onSuccess: (blob) => {
      setQrError("");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `veritas-qr-${diploma.registration_number}.png`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (err: Error) => {
      setQrError(
        err.message === "no_share"
          ? "Сначала создайте ссылку для работодателя"
          : "Ошибка загрузки QR"
      );
    },
  });

  return (
    <>
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
        {/* University header */}
        <div className="px-4 py-3 bg-[#1c1917] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 bg-white/5 relative">
              {diploma.university_avatar_url ? (
                <Image
                  src={diploma.university_avatar_url}
                  alt={diploma.university_name ?? "Логотип ВУЗа"}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-[#a05c20]" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <span className="text-[#f0d4a0] text-xs font-medium truncate">
              {diploma.university_name ?? "Учебное заведение"}
            </span>
          </div>
          <StatusBadge status={diploma.status as "active" | "revoked" | "suspended"} />
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-3 flex-1">
          <div className="flex items-start gap-2">
            <GraduationCap className="h-4 w-4 text-[#a05c20] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Специальность</p>
              <p className="font-semibold text-[#1c1917] text-sm leading-tight">{diploma.specialty_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#a05c20] flex-shrink-0" />
            <div>
              <p className="text-xs text-stone-400">Год окончания</p>
              <p className="font-medium text-[#1c1917] text-sm">{diploma.study_end_year}</p>
            </div>
          </div>

          <div className="text-xs text-stone-400 font-mono bg-stone-50 rounded px-2 py-1 select-all">
            {diploma.registration_number}
          </div>

          {/* Activity toggle */}
          {diploma.verification_count > 0 && (
            <button
              onClick={() => setActivityOpen((v) => !v)}
              className="w-full flex items-center justify-between text-xs bg-stone-50 hover:bg-stone-100 border border-stone-100 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <span className="flex items-center gap-1.5 text-stone-500">
                <Eye className="h-3.5 w-3.5" />
                Проверен&nbsp;
                <span className="font-semibold text-[#a05c20]">{diploma.verification_count}</span>
                &nbsp;{diploma.verification_count === 1 ? "раз" : diploma.verification_count < 5 ? "раза" : "раз"}
                {diploma.last_verified_at && (
                  <span className="text-stone-400 hidden sm:inline">
                    &nbsp;·&nbsp;{timeAgo(diploma.last_verified_at)}
                  </span>
                )}
              </span>
              {activityOpen
                ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" />
                : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
              }
            </button>
          )}

          {/* Activity feed (lazy) */}
          {activityOpen && (
            <div className="border border-stone-100 rounded-lg overflow-hidden">
              <div className="px-3 py-1.5 bg-stone-50 flex items-center gap-1.5 border-b border-stone-100">
                <Clock className="h-3 w-3 text-stone-400" />
                <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                  Активность
                </span>
              </div>
              <div className="px-3 py-1.5">
                {activityLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-4 w-4 border-2 border-[#a05c20] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <ActivityFeed
                    items={activity ?? []}
                    shareRecipient={diploma.share_recipient ?? null}
                    validUntil={diploma.employer_link_valid_until}
                  />
                )}
              </div>
            </div>
          )}

          {qrError && <p className="text-xs text-red-600">{qrError}</p>}
        </div>

        {/* Actions */}
        {diploma.status === "active" && (
          <div className="px-4 pb-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-[#a05c20] text-[#a05c20] hover:bg-[#a05c20] hover:text-white"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              Поделиться
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={qrMutation.isPending}
              onClick={() => qrMutation.mutate()}
            >
              <QrCode className="h-3.5 w-3.5 mr-1.5" />
              {qrMutation.isPending ? "..." : "QR-код"}
            </Button>
          </div>
        )}
      </div>

      <ShareLinkDialog diplomaId={diploma.id} open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}

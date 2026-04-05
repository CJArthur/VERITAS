"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Building2, CheckCircle, XCircle, Calendar, ExternalLink,
  AlertTriangle, RefreshCw, ShieldCheck, ShieldX, HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiGet, apiPost, OrgVerificationResult, PendingUniversity } from "@/lib/api";

interface AdminUniversityCardProps {
  university: PendingUniversity;
}

function RecommendationBadge({ rec, reason }: { rec: OrgVerificationResult["recommendation"]; reason: string }) {
  if (rec === "approve") return (
    <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
      <ShieldCheck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-green-600" />
      <span>{reason}</span>
    </div>
  );
  if (rec === "reject") return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-800">
      <ShieldX className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-red-500" />
      <span>{reason}</span>
    </div>
  );
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
      <HelpCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
      <span>{reason}</span>
    </div>
  );
}

function VerificationRow({ label, ok, detail }: { label: string; ok: boolean | null; detail?: string | null }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok === null
        ? <HelpCircle className="h-3.5 w-3.5 text-stone-400 flex-shrink-0" />
        : ok
        ? <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
        : <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
      }
      <span className="text-stone-600 font-medium">{label}</span>
      {detail && <span className="text-stone-400 truncate">{detail}</span>}
    </div>
  );
}

export function AdminUniversityCard({ university }: AdminUniversityCardProps) {
  const router = useRouter();
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");

  // Auto-run verification when card mounts
  const { data: verification, isLoading: isVerifying, refetch: refetchVerify } = useQuery<OrgVerificationResult>({
    queryKey: ["org-verify", university.id],
    queryFn: () => apiGet<OrgVerificationResult>(`/api/v1/admin/universities/${university.id}/verify`),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const approveMutation = useMutation({
    mutationFn: () => apiPost<void>(`/api/v1/admin/universities/${university.id}/approve`),
    onSuccess: () => router.refresh(),
  });

  const rejectMutation = useMutation({
    mutationFn: (r: string) =>
      apiPost<void>(`/api/v1/admin/universities/${university.id}/reject`, { reason: r }),
    onSuccess: () => router.refresh(),
  });

  const isPending = approveMutation.isPending || rejectMutation.isPending;
  const mutationError =
    (approveMutation.error instanceof ApiError ? approveMutation.error.detail : null) ||
    (rejectMutation.error instanceof ApiError ? rejectMutation.error.detail : null);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1c1917] flex items-center justify-center flex-shrink-0">
          <Building2 className="h-5 w-5 text-[#a05c20]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[#1c1917] text-sm leading-tight">{university.name}</h3>
          <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(university.created_at).toLocaleDateString("ru-RU")}
          </p>
        </div>
      </div>

      {/* Registry fields */}
      <div className="grid grid-cols-1 gap-1.5 text-xs">
        {[
          { label: "ОГРН", value: university.ogrn },
          { label: "Лицензия", value: university.license_number },
          { label: "Аккредитация", value: university.accreditation_number },
        ].map((r) => (
          <div key={r.label} className="flex items-center gap-2 bg-stone-50 rounded-md px-2.5 py-1.5">
            <span className="text-stone-400 w-20 flex-shrink-0">{r.label}</span>
            <span className="font-medium text-[#1c1917] font-mono truncate">{r.value || "—"}</span>
          </div>
        ))}
      </div>

      {/* Auto-verification results */}
      <div className="border border-stone-100 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Автопроверка</span>
          <button
            onClick={() => refetchVerify()}
            className="text-stone-400 hover:text-stone-600 transition-colors"
            title="Повторить проверку"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isVerifying ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isVerifying && !verification && (
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Проверяем в реестрах ФНС…
          </div>
        )}

        {verification && (
          <>
            <VerificationRow
              label="Контрольная сумма ОГРН"
              ok={verification.ogrn_checksum_valid}
              detail={verification.ogrn_checksum_valid ? "формат корректен" : "неверный формат"}
            />
            {verification.ogrn_dadata_used ? (
              <VerificationRow
                label="ЕГРЮЛ (DaData)"
                ok={verification.ogrn_found_in_egrul && verification.ogrn_is_active}
                detail={
                  verification.ogrn_verified_name
                    ? `${verification.ogrn_verified_name}${verification.ogrn_inn ? ` · ИНН ${verification.ogrn_inn}` : ""}`
                    : verification.ogrn_error || "не найдена"
                }
              />
            ) : (
              <VerificationRow
                label="ЕГРЮЛ"
                ok={null}
                detail="DADATA_API_KEY не задан — добавьте ключ для проверки в ЕГРЮЛ"
              />
            )}

            {/* External links for manual license/accreditation check */}
            <div className="pt-1 space-y-1">
              <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">Проверить лицензию:</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={verification.fns_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#a05c20] hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  ФНС ЕГРЮЛ
                </a>
                {university.license_number && (
                  <a
                    href={verification.rosobr_license_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#a05c20] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Лицензии Рособрнадзор
                  </a>
                )}
                {university.accreditation_number && (
                  <a
                    href={verification.rosobr_accred_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#a05c20] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Аккредитации
                  </a>
                )}
              </div>
            </div>

            <RecommendationBadge
              rec={verification.recommendation}
              reason={verification.recommendation_reason}
            />
          </>
        )}
      </div>

      {mutationError && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          {mutationError}
        </div>
      )}

      {/* Actions */}
      {rejectMode ? (
        <div className="space-y-2">
          <Input
            placeholder="Причина отклонения"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => { setRejectMode(false); rejectMutation.reset(); }}
            >
              Назад
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isPending || !reason.trim()}
              onClick={() => rejectMutation.mutate(reason)}
            >
              {rejectMutation.isPending ? "..." : "Отклонить"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-green-700 hover:bg-green-800 text-white"
            disabled={isPending}
            onClick={() => approveMutation.mutate()}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            {approveMutation.isPending ? "..." : "Одобрить"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            disabled={isPending}
            onClick={() => setRejectMode(true)}
          >
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Отклонить
          </Button>
        </div>
      )}
    </div>
  );
}

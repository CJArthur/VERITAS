"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Building2, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiPost, PendingUniversity } from "@/lib/api";

interface AdminUniversityCardProps {
  university: PendingUniversity;
}

export function AdminUniversityCard({ university }: AdminUniversityCardProps) {
  const router = useRouter();
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");

  const approveMutation = useMutation({
    mutationFn: () =>
      apiPost<void>(`/api/v1/admin/universities/${university.id}/approve`),
    onSuccess: () => router.refresh(),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) =>
      apiPost<void>(`/api/v1/admin/universities/${university.id}/reject`, { reason }),
    onSuccess: () => router.refresh(),
  });

  const isPending = approveMutation.isPending || rejectMutation.isPending;
  const error =
    (approveMutation.error instanceof ApiError ? approveMutation.error.detail : null) ||
    (rejectMutation.error instanceof ApiError ? rejectMutation.error.detail : null) ||
    (isPending ? null : null);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[#1c1917] flex items-center justify-center flex-shrink-0">
          <Building2 className="h-5 w-5 text-[#a05c20]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[#1c1917] text-sm">{university.name}</h3>
          <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(university.created_at).toLocaleDateString("ru-RU")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-4">
        {[
          { label: "ОГРН", value: university.ogrn },
          { label: "Лицензия", value: university.license_number },
          { label: "Аккредитация", value: university.accreditation_number },
        ].map((r) => (
          <div key={r.label} className="bg-stone-50 rounded-md px-2 py-1.5">
            <p className="text-stone-400">{r.label}</p>
            <p className="font-medium text-[#1c1917] font-mono">{r.value}</p>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

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

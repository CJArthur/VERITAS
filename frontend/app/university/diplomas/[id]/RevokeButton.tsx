"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiPost } from "@/lib/api";

export function RevokeButton({ diplomaId }: { diplomaId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState("");

  const revokeMutation = useMutation({
    mutationFn: (reason: string) =>
      apiPost<void>(
        `/api/v1/university/diplomas/${diplomaId}/revoke?reason=${encodeURIComponent(reason)}`
      ),
    onSuccess: () => {
      // Инвалидируем кэш таблицы — статус обновится при возврате к списку
      queryClient.invalidateQueries({ queryKey: ["university-diplomas"] });
      // Перерендериваем server component с актуальными данными
      router.refresh();
    },
  });

  function handleRevoke() {
    if (!reason.trim()) {
      revokeMutation.reset();
      return;
    }
    revokeMutation.mutate(reason);
  }

  if (!confirm) {
    return (
      <Button
        variant="outline"
        className="w-full border-red-300 text-red-600 hover:bg-red-50"
        onClick={() => setConfirm(true)}
      >
        <XCircle className="h-4 w-4 mr-2" />
        Аннулировать диплом
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-red-600 text-xs font-medium">
        <AlertTriangle className="h-3.5 w-3.5" />
        Это действие необратимо
      </div>
      <Input
        placeholder="Причина аннулирования"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="text-sm"
      />
      {!reason.trim() && revokeMutation.isIdle === false && (
        <p className="text-xs text-red-600">Укажите причину</p>
      )}
      {revokeMutation.error && (
        <p className="text-xs text-red-600">
          {revokeMutation.error instanceof ApiError
            ? revokeMutation.error.detail
            : "Ошибка аннулирования"}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setConfirm(false); revokeMutation.reset(); }}
          className="flex-1"
        >
          Отмена
        </Button>
        <Button
          size="sm"
          disabled={revokeMutation.isPending}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          onClick={handleRevoke}
        >
          {revokeMutation.isPending ? "..." : "Подтвердить"}
        </Button>
      </div>
    </div>
  );
}

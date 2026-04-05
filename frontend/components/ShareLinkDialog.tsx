"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, ExternalLink, Clock, User } from "lucide-react";
import { ApiError, apiPost } from "@/lib/api";
import { buttonVariants } from "@/lib/button-variants";

interface ShareLinkDialogProps {
  diplomaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShareResult {
  verification_url: string;
  employer_link_valid_until: string;
  recipient: string | null;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ShareLinkDialog({ diplomaId, open, onOpenChange }: ShareLinkDialogProps) {
  const [hours, setHours]         = useState(72);
  const [recipient, setRecipient] = useState("");
  const [result, setResult]       = useState<ShareResult | null>(null);
  const [copied, setCopied]       = useState(false);

  const createMutation = useMutation({
    mutationFn: (vars: { validHours: number; recipient: string }) =>
      apiPost<ShareResult>(`/api/v1/student/diplomas/${diplomaId}/share`, {
        valid_hours: vars.validHours,
        recipient: vars.recipient.trim() || null,
      }),
    onSuccess: (data) => setResult(data),
  });

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.verification_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    onOpenChange(false);
    setResult(null);
    setHours(72);
    setRecipient("");
    createMutation.reset();
  }

  const daysLabel =
    hours < 24
      ? `${hours} ч.`
      : hours % 24 === 0
      ? `${hours / 24} дн.`
      : `${Math.round(hours / 24)} дн.`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1c1917]">
            <Clock className="h-5 w-5 text-[#a05c20]" />
            Ссылка для работодателя
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-5 py-1">
            <p className="text-sm text-stone-500">
              Работодатель откроет ссылку в браузере — без регистрации, без приложений.
              Ссылка автоматически истечёт через указанное время.
            </p>

            {/* Recipient */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1c1917]">
                Для кого
                <span className="ml-1.5 text-stone-400 font-normal text-xs">необязательно</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                <Input
                  className="pl-9"
                  placeholder="Например: Сбербанк HR, Яндекс"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  maxLength={120}
                />
              </div>
              <p className="text-xs text-stone-400">
                Отобразится на странице верификации — работодатель увидит, что ссылка создана персонально для него
              </p>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-[#1c1917]">Срок действия</Label>
                <span className="text-sm font-semibold text-[#a05c20]">{daysLabel}</span>
              </div>
              <input
                type="range"
                min={1}
                max={720}
                step={1}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full accent-[#a05c20]"
              />
              <div className="flex justify-between text-xs text-stone-400">
                {["1 ч.", "3 дн.", "1 нед.", "2 нед.", "1 мес."].map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>
            </div>

            {createMutation.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {createMutation.error instanceof ApiError
                  ? createMutation.error.detail
                  : "Ошибка создания ссылки"}
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Отмена</Button>
              <Button
                onClick={() => createMutation.mutate({ validHours: hours, recipient })}
                disabled={createMutation.isPending}
                className="bg-[#1c1917] text-[#f0d4a0] hover:bg-[#2a2622]"
              >
                {createMutation.isPending ? "Создание..." : "Создать ссылку"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            {result.recipient && (
              <div className="flex items-center gap-2 bg-[#a05c20]/10 border border-[#a05c20]/20 rounded-lg px-3 py-2">
                <User className="h-4 w-4 text-[#a05c20] flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#a05c20] font-medium">Открыто для</p>
                  <p className="text-sm font-semibold text-[#1c1917]">{result.recipient}</p>
                </div>
              </div>
            )}

            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Ссылка создана. Перешлите её напрямую или вставьте в резюме.
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1c1917]">Ссылка верификации</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={result.verification_url}
                  className="font-mono text-xs bg-stone-50 select-all"
                  onFocus={(e) => e.target.select()}
                />
                <Button variant="outline" size="icon" onClick={handleCopy} title="Скопировать">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
                <a
                  href={result.verification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Открыть"
                  className={buttonVariants({ variant: "outline", size: "icon" })}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <p className="text-xs text-stone-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Истекает: {fmt(result.employer_link_valid_until)}
            </p>

            <DialogFooter>
              <Button onClick={handleClose} className="bg-[#1c1917] text-[#f0d4a0] hover:bg-[#2a2622]">
                Готово
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

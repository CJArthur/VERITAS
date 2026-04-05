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
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, ExternalLink, Clock } from "lucide-react";
import { ApiError, apiPost } from "@/lib/api";

interface ShareLinkDialogProps {
  diplomaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShareResult {
  verification_url: string;
  employer_link_valid_until: string;
}

export function ShareLinkDialog({ diplomaId, open, onOpenChange }: ShareLinkDialogProps) {
  const [hours, setHours] = useState(72);
  const [result, setResult] = useState<ShareResult | null>(null);
  const [copied, setCopied] = useState(false);

  const createMutation = useMutation({
    mutationFn: (validHours: number) =>
      apiPost<ShareResult>(`/api/v1/student/diplomas/${diplomaId}/share`, {
        valid_hours: validHours,
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
    createMutation.reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#a05c20]" />
            Ссылка для работодателя
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-stone-500">
              Создайте временную ссылку. Работодатель увидит только данные диплома.
            </p>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1c1917]">Срок действия (часы)</Label>
              <Input
                type="number"
                min={1}
                max={8760}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
              <p className="text-xs text-stone-400">
                {hours < 24 ? `${hours} ч` : `${Math.round(hours / 24)} дн.`} — ссылка автоматически истечёт
              </p>
            </div>
            {createMutation.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {createMutation.error instanceof ApiError
                  ? createMutation.error.detail
                  : "Ошибка создания ссылки"}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Отмена</Button>
              <Button
                onClick={() => createMutation.mutate(hours)}
                disabled={createMutation.isPending}
                className="bg-[#1c1917] text-[#f0d4a0] hover:bg-[#2a2622]"
              >
                {createMutation.isPending ? "Создание..." : "Создать ссылку"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              Ссылка создана. Поделитесь ею с работодателем.
            </p>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1c1917]">Ссылка верификации</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={result.verification_url}
                  className="font-mono text-xs bg-stone-50"
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
            <p className="text-xs text-stone-400">
              Действительна до:{" "}
              {new Date(result.employer_link_valid_until).toLocaleString("ru-RU")}
            </p>
            <DialogFooter>
              <Button onClick={handleClose} className="bg-[#1c1917] text-[#f0d4a0]">
                Готово
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

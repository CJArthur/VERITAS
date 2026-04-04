"use client";

import { useState } from "react";
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
import { Copy, Check, ExternalLink, Clock } from "lucide-react";
import { ApiError } from "@/lib/api";

interface ShareLinkDialogProps {
  diplomaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareLinkDialog({ diplomaId, open, onOpenChange }: ShareLinkDialogProps) {
  const [hours, setHours] = useState(72);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ verification_url: string; employer_link_valid_until: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setError(""); setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
      const res = await fetch(`${apiUrl}/api/v1/student/diplomas/${diplomaId}/share`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valid_hours: hours }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body.detail || "Ошибка");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Ошибка создания ссылки");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.verification_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    onOpenChange(false);
    setResult(null);
    setError("");
    setHours(72);
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
              <Input type="number" min={1} max={8760} value={hours}
                onChange={(e) => setHours(Number(e.target.value))} />
              <p className="text-xs text-stone-400">
                {hours < 24 ? `${hours} ч` : `${Math.round(hours / 24)} дн.`} — ссылка автоматически истечёт
              </p>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Отмена</Button>
              <Button onClick={handleCreate} disabled={loading}
                className="bg-[#1c1917] text-[#f0d4a0] hover:bg-[#2a2622]">
                {loading ? "Создание..." : "Создать ссылку"}
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
                <Input readOnly value={result.verification_url} className="font-mono text-xs bg-stone-50" />
                <Button variant="outline" size="icon" onClick={handleCopy} title="Скопировать">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" asChild title="Открыть">
                  <a href={result.verification_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <p className="text-xs text-stone-400">
              Действительна до: {new Date(result.employer_link_valid_until).toLocaleString("ru-RU")}
            </p>
            <DialogFooter>
              <Button onClick={handleClose} className="bg-[#1c1917] text-[#f0d4a0]">Готово</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

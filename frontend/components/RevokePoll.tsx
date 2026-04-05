"use client";

import { useEffect, useState } from "react";
import { ShieldX, AlertTriangle } from "lucide-react";

interface RevokePollProps {
  token: string;
  initialStatus: string;
}

const POLL_INTERVAL_MS = 6_000;

/**
 * Silently polls the diploma status every 6 seconds.
 * If the status changes from "active" to anything else while the employer
 * is viewing the page, we immediately overlay a full-screen revocation notice.
 *
 * This is the live-revoke demo feature: revoke from the admin panel and the
 * employer's open tab turns red in real time — without any page refresh.
 */
export function RevokePoll({ token, initialStatus }: RevokePollProps) {
  const [revoked, setRevoked] = useState(false);
  const [revokedAt, setRevokedAt] = useState<string | null>(null);

  useEffect(() => {
    // No-op if already invalid on first load
    if (initialStatus !== "active") return;

    const apiUrl =
      typeof window !== "undefined"
        ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8200")
        : "";

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/v1/public/diplomas/${token}/status`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data: { status: string } = await res.json();
        if (data.status !== "active") {
          setRevoked(true);
          setRevokedAt(new Date().toLocaleString("ru-RU", {
            day: "2-digit", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          }));
          clearInterval(interval);
        }
      } catch {
        // Network error — ignore, keep polling
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [token, initialStatus]);

  if (!revoked) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-950/98 backdrop-blur-sm"
      style={{ animation: "fadeIn 0.4s ease-out" }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(1.02); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 rounded-full bg-red-900/60 border border-red-700/40 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="h-10 w-10 text-red-300" strokeWidth={1.2} />
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight mb-3">
          ДИПЛОМ АННУЛИРОВАН
        </h1>

        <div className="flex items-start gap-2.5 bg-red-900/40 border border-red-700/30 rounded-xl px-4 py-3 mb-6 text-left">
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-200 text-sm leading-relaxed">
            Учебное заведение аннулировало этот диплом после того, как вы открыли страницу.
            Документ <strong>не может служить подтвержде��ием образования</strong>.
          </p>
        </div>

        {revokedAt && (
          <p className="text-red-400/70 text-xs">
            Статус изменён: {revokedAt}
          </p>
        )}

        <div className="mt-8 h-px bg-red-800/40 w-16 mx-auto mb-4" />
        <p className="text-red-500/60 text-xs font-semibold tracking-widest">VERITAS</p>
      </div>
    </div>
  );
}

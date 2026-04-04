"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Trash2, Copy, Check, Clock, Building2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";

interface ApiKeyEntry {
  id: string;
  org_name: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

interface NewKeyResult {
  id: string;
  org_name: string;
  api_key: string;
  warning: string;
}

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<NewKeyResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

  async function loadKeys() {
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/employer-keys`, {
        credentials: "include",
      });
      if (res.ok) setKeys(await res.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadKeys(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) return;
    setCreating(true); setError("");
    try {
      const res = await fetch(
        `${apiUrl}/api/v1/admin/employer-keys?org_name=${encodeURIComponent(orgName.trim())}`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body.detail || "Ошибка создания ключа");
      }
      const data: NewKeyResult = await res.json();
      setNewKey(data);
      setOrgName("");
      await loadKeys();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Ошибка");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevoking(id);
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/employer-keys/${id}`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) await loadKeys();
    } catch {}
    setRevoking(null);
  }

  async function handleCopy() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* New key banner */}
      {newKey && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-green-800 text-sm">
              API-ключ создан для: {newKey.org_name}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <code className="flex-1 bg-white border border-green-200 rounded px-3 py-2 text-xs font-mono text-stone-700 break-all">
              {newKey.api_key}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopy}
              className="border-green-300 flex-shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs font-medium">
              Сохраните ключ сейчас — он больше не будет показан. Передайте его организации через защищённый канал.
            </p>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setNewKey(null)}>
            Закрыть
          </Button>
        </div>
      )}

      {/* Create form */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1c1917] mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-[#a05c20]" />
          Выдать новый API-ключ
        </h3>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Input
            placeholder="Название организации (напр. Сбер HR, ВТБ Рекрутинг)"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={creating}
            className="bg-[#1c1917] text-[#f0d4a0] hover:bg-[#2a2622] sm:flex-shrink-0 w-full sm:w-auto">
            {creating ? "Создание..." : "Создать ключ"}
          </Button>
        </form>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        <p className="text-xs text-stone-400 mt-3">
          Ключ выдаётся один раз. После создания — сохраните и передайте организации. Использование:{" "}
          <code className="bg-stone-100 px-1 rounded">Authorization: Bearer &lt;key&gt;</code>
        </p>
      </div>

      {/* Keys list */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-stone-100 bg-stone-50 flex items-center gap-2">
          <Key className="h-4 w-4 text-stone-400" />
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Активные ключи ({keys.filter(k => k.is_active).length})
          </h3>
        </div>
        {loading ? (
          <div className="py-12 text-center text-stone-400 text-sm">Загрузка...</div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-sm">Ключи ещё не выданы</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {keys.map((k) => (
              <div key={k.id} className="flex items-start sm:items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                  <Building2 className="h-4 w-4 text-stone-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#1c1917] truncate">{k.org_name}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      k.is_active ? "bg-green-50 text-green-700" : "bg-stone-100 text-stone-400"
                    }`}>
                      {k.is_active ? "Активен" : "Отозван"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-stone-400">
                      Создан: {new Date(k.created_at).toLocaleDateString("ru-RU")}
                    </span>
                    {k.last_used_at && (
                      <span className="text-xs text-stone-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Исп.: {new Date(k.last_used_at).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                  </div>
                </div>
                {k.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 text-xs flex-shrink-0"
                    disabled={revoking === k.id}
                    onClick={() => handleRevoke(k.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">{revoking === k.id ? "..." : "Отозвать"}</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API docs link */}
      <div className="bg-[#1c1917] rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-[#a05c20]/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Key className="h-5 w-5 text-[#a05c20]" />
        </div>
        <div>
          <p className="text-[#f0d4a0] font-semibold text-sm mb-1">Документация API для работодателей</p>
          <p className="text-stone-400 text-xs mb-3 leading-relaxed">
            Endpoint: <code className="text-stone-300">GET /api/v1/employer/verify/&#123;token&#125;</code><br />
            Возвращает полные данные диплома с результатом криптопроверки. Каждый запрос фиксируется в журнале.
          </p>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200"}/docs#/Employer%20API`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#a05c20] text-xs font-medium hover:text-[#c8895a]"
          >
            Открыть Swagger документацию →
          </a>
        </div>
      </div>
    </div>
  );
}

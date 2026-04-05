"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Trash2, CheckCircle, AlertTriangle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiPut, apiPost } from "@/lib/api";

function Section({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <Icon className="h-5 w-5 text-[#a05c20]" strokeWidth={1.5} />
        <h2 className="font-semibold text-[#1c1917]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function StudentProfilePage() {
  const router = useRouter();

  // Change login
  const [newLogin, setNewLogin] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMsg, setLoginMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Change password
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Delete account
  const [deletePass, setDeletePass] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleLoginChange(e: React.FormEvent) {
    e.preventDefault();
    if (!newLogin.trim()) return;
    setLoginLoading(true);
    setLoginMsg(null);
    try {
      await apiPut("/api/v1/change-login", { new_login: newLogin.trim() });
      setLoginMsg({ ok: true, text: "Логин успешно изменён" });
      setNewLogin("");
    } catch (err) {
      setLoginMsg({ ok: false, text: err instanceof ApiError ? err.detail : "Ошибка изменения логина" });
    } finally {
      setLoginLoading(false);
    }
  }

  async function handlePassChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPassMsg({ ok: false, text: "Пароли не совпадают" });
      return;
    }
    if (newPass.length < 8) {
      setPassMsg({ ok: false, text: "Пароль должен быть не менее 8 символов" });
      return;
    }
    setPassLoading(true);
    setPassMsg(null);
    try {
      await apiPost("/api/v1/set-new-pass", {
        old_pass: oldPass,
        new_pass: newPass,
        confirm_new_pass: confirmPass,
      });
      setPassMsg({ ok: true, text: "Пароль успешно изменён" });
      setOldPass(""); setNewPass(""); setConfirmPass("");
    } catch (err) {
      setPassMsg({ ok: false, text: err instanceof ApiError ? err.detail : "Ошибка изменения пароля" });
    } finally {
      setPassLoading(false);
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleteLoading(true);
    setDeleteMsg(null);
    try {
      await apiPost("/api/v1/delete-profile", { password: deletePass });
      router.push("/login");
    } catch (err) {
      setDeleteMsg({ ok: false, text: err instanceof ApiError ? err.detail : "Ошибка удаления аккаунта" });
      setDeleteLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-[#1c1917]">Профиль</h1>
        <p className="text-stone-500 text-sm mt-1">Управление аккаунтом</p>
      </div>

      {/* Change login */}
      <Section title="Изменить логин" icon={User}>
        <form onSubmit={handleLoginChange} className="space-y-4">
          <div>
            <Label htmlFor="new-login">Новый логин</Label>
            <Input
              id="new-login"
              className="mt-1.5"
              placeholder="Введите новый логин"
              value={newLogin}
              onChange={(e) => setNewLogin(e.target.value)}
              required
              minLength={3}
            />
          </div>
          {loginMsg && (
            <p className={`text-sm flex items-center gap-1.5 ${loginMsg.ok ? "text-green-600" : "text-red-600"}`}>
              {loginMsg.ok ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {loginMsg.text}
            </p>
          )}
          <Button
            type="submit"
            disabled={loginLoading || !newLogin.trim()}
            className="bg-[#1c1917] text-[#f0d4a0] hover:bg-[#2a2622]"
          >
            {loginLoading ? "Сохранение..." : "Сохранить логин"}
          </Button>
        </form>
      </Section>

      {/* Change password */}
      <Section title="Изменить пароль" icon={Lock}>
        <form onSubmit={handlePassChange} className="space-y-4">
          <div>
            <Label htmlFor="old-pass">Текущий пароль</Label>
            <Input id="old-pass" type="password" className="mt-1.5" placeholder="••••••••"
              value={oldPass} onChange={(e) => setOldPass(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="new-pass">Новый пароль</Label>
            <Input id="new-pass" type="password" className="mt-1.5" placeholder="••••••••"
              value={newPass} onChange={(e) => setNewPass(e.target.value)} required minLength={8} />
          </div>
          <div>
            <Label htmlFor="confirm-pass">Повторите новый пароль</Label>
            <Input id="confirm-pass" type="password" className="mt-1.5" placeholder="••••••••"
              value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required minLength={8} />
          </div>
          {passMsg && (
            <p className={`text-sm flex items-center gap-1.5 ${passMsg.ok ? "text-green-600" : "text-red-600"}`}>
              {passMsg.ok ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {passMsg.text}
            </p>
          )}
          <Button type="submit" disabled={passLoading} className="bg-[#1c1917] text-[#f0d4a0] hover:bg-[#2a2622]">
            {passLoading ? "Сохранение..." : "Изменить пароль"}
          </Button>
        </form>
      </Section>

      {/* Delete account */}
      <Section title="Удалить аккаунт" icon={Trash2}>
        <p className="text-sm text-stone-500 mb-4">
          Это действие необратимо. Все данные аккаунта будут удалены, привязки дипломов сброшены.
        </p>
        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <Label htmlFor="delete-pass">Подтвердите паролем</Label>
            <Input id="delete-pass" type="password" className="mt-1.5" placeholder="••••••••"
              value={deletePass} onChange={(e) => { setDeletePass(e.target.value); setConfirmDelete(false); }}
              required />
          </div>
          {deleteMsg && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />{deleteMsg.text}
            </p>
          )}
          {confirmDelete && !deleteLoading && (
            <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Нажмите ещё раз для подтверждения удаления аккаунта
            </p>
          )}
          <Button type="submit" disabled={deleteLoading || !deletePass}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white">
            <Trash2 className="h-4 w-4 mr-1.5" />
            {deleteLoading ? "Удаление..." : confirmDelete ? "Подтвердить удаление" : "Удалить аккаунт"}
          </Button>
        </form>
      </Section>
    </div>
  );
}

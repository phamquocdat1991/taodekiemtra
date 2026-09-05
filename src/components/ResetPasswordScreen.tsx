import React, { useState } from "react";
import { CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

export function ResetPasswordScreen() {
  const { finishRecovery, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) {
      setError("Hai mật khẩu chưa khớp.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await updatePassword(password);
      finishRecovery();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đổi mật khẩu.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell grid min-h-screen place-items-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-950/15 sm:p-9">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-[#071a33]"><KeyRound className="h-5 w-5" /></div>
        <h1 className="text-2xl font-black text-[#071a33]">Đặt mật khẩu mới</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Dùng ít nhất 8 ký tự và không chia sẻ mật khẩu với người khác.</p>
        <label className="mt-6 block text-sm font-bold text-slate-700" htmlFor="new-password">Mật khẩu mới<input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required className="auth-input mt-2" /></label>
        <label className="mt-4 block text-sm font-bold text-slate-700" htmlFor="new-password-confirmation">Nhập lại mật khẩu<input id="new-password-confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} required className="auth-input mt-2" /></label>
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f2a900] px-5 py-3.5 text-sm font-black text-[#071a33] disabled:opacity-60">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Lưu mật khẩu mới</button>
      </form>
    </main>
  );
}

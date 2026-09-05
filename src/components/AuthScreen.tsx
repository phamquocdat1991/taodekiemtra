import React, { useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Eye,
  EyeOff,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

type Mode = "login" | "signup" | "forgot";

const translateError = (message: string) => {
  if (/invalid login credentials/i.test(message)) return "Email hoặc mật khẩu chưa đúng.";
  if (/email not confirmed/i.test(message)) return "Vui lòng xác nhận email trước khi đăng nhập.";
  if (/user already registered/i.test(message)) return "Email này đã được đăng ký.";
  if (/rate limit/i.test(message)) return "Thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
  return message;
};

export function AuthScreen({ onStudentPortal }: { onStudentPortal: () => void }) {
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "forgot") {
        await requestPasswordReset(email);
        setNotice("Đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.");
      } else if (mode === "signup") {
        if (password !== confirmPassword) throw new Error("Hai mật khẩu chưa khớp.");
        const signedIn = await signUp(email, password, displayName);
        if (!signedIn) {
          setNotice("Tài khoản đã được tạo. Vui lòng xác nhận email để đăng nhập.");
        }
      } else {
        await signIn(email, password);
      }
    } catch (cause) {
      setError(translateError(cause instanceof Error ? cause.message : "Không thể đăng nhập."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell min-h-screen px-4 py-8 md:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-2xl shadow-slate-950/20 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#071a33] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#f2a900]/15 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="relative">
            <div className="mb-10 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f2a900] text-[#071a33] shadow-lg shadow-amber-500/20">
                <BookOpenCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">ExamCraft AI</p>
                <p className="text-sm text-slate-300">Chuẩn GDPT 2018</p>
              </div>
            </div>
            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight xl:text-5xl">
              Tạo đề chính xác.<br />Quản lý lớp học <span className="text-amber-300">thông minh.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              Một quy trình liền mạch từ ma trận, bản đặc tả, đề thi đến chấm điểm và phân tích kết quả.
            </p>
          </div>
          <div className="relative grid gap-3">
            {[
              [Sparkles, "AI tạo nội dung có kiểm tra tính nhất quán"],
              [ShieldCheck, "Dữ liệu lớp học được bảo vệ theo từng giáo viên"],
              [GraduationCap, "Học sinh vào thi nhanh bằng mã PIN"],
            ].map(([Icon, label]) => (
              <div key={String(label)} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur">
                <Icon className="h-4 w-4 text-amber-300" />
                <span>{String(label)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center bg-[#f7f9fc] p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f2a900] text-[#071a33]">
                  <BookOpenCheck className="h-5 w-5" />
                </div>
                <span className="font-black text-[#071a33]">ExamCraft AI</span>
              </div>
            </div>

            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#a36300]">Cổng giáo viên</p>
            <h2 className="text-3xl font-black tracking-tight text-[#071a33]">
              {mode === "login" ? "Chào mừng thầy cô" : mode === "signup" ? "Tạo tài khoản" : "Khôi phục mật khẩu"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {mode === "forgot" ? "Nhập email để nhận liên kết đặt lại mật khẩu." : "Đăng nhập để tiếp tục tạo đề và quản lý phòng thi."}
            </p>

            <form className="mt-8 space-y-4" onSubmit={submit}>
              {mode === "signup" && (
                <label className="block text-sm font-bold text-slate-700" htmlFor="display-name">
                  Tên giáo viên
                  <span className="relative mt-2 block">
                    <GraduationCap className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input id="display-name" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="auth-input pl-11" placeholder="Nguyễn Văn An" required />
                  </span>
                </label>
              )}

              <label className="block text-sm font-bold text-slate-700" htmlFor="teacher-email">
                Email
                <span className="relative mt-2 block">
                  <Mail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input id="teacher-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="auth-input pl-11" placeholder="giaovien@truong.edu.vn" required />
                </span>
              </label>

              {mode !== "forgot" && (
                <label className="block text-sm font-bold text-slate-700" htmlFor="teacher-password">
                  Mật khẩu
                  <span className="relative mt-2 block">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input id="teacher-password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="auth-input px-11" placeholder="Ít nhất 8 ký tự" required minLength={8} />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-2.5 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>
              )}

              {mode === "signup" && (
                <label className="block text-sm font-bold text-slate-700" htmlFor="confirm-password">
                  Nhập lại mật khẩu
                  <input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="auth-input mt-2" required minLength={8} />
                </label>
              )}

              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
              {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</p>}

              <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f2a900] px-5 py-3.5 text-sm font-black text-[#071a33] shadow-lg shadow-amber-500/20 transition hover:bg-[#ffbd2e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#071a33] disabled:cursor-wait disabled:opacity-60">
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {mode === "login" ? "Đăng nhập" : mode === "signup" ? "Tạo tài khoản" : "Gửi liên kết khôi phục"}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
              {mode === "login" && <button type="button" onClick={() => switchMode("forgot")} className="font-bold text-[#164e7a] hover:underline">Quên mật khẩu?</button>}
              <button type="button" onClick={() => switchMode(mode === "signup" ? "login" : mode === "login" ? "signup" : "login")} className="ml-auto font-bold text-[#a36300] hover:underline">
                {mode === "signup" ? "Đã có tài khoản" : mode === "login" ? "Đăng ký tài khoản" : "Quay lại đăng nhập"}
              </button>
            </div>

            <div className="my-7 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-300"><span className="h-px flex-1 bg-slate-200" />Hoặc<span className="h-px flex-1 bg-slate-200" /></div>
            <button type="button" onClick={onStudentPortal} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-[#071a33] transition hover:border-amber-300 hover:bg-amber-50">
              <GraduationCap className="h-4 w-4 text-[#a36300]" /> Học sinh vào phòng thi
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

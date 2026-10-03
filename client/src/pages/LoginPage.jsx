import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/AuthLayout";
import { EMAIL_RE, useAuth } from "@/context/AuthContext";
function LoginPage() {
  const { user, login } = useAuth();
  useEffect(() => { document.title = "Đăng nhập | Sổ Mây"; }, []);
  const [params] = useSearchParams();
  const registered = ["true", "1"].includes(params.get("registered") ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const resetDone = ["true", "1"].includes(params.get("reset") ?? "");
  const info = registered ? "Đăng ký thành công! Hãy đăng nhập để bắt đầu." : resetDone ? "Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới." : "";
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const mail = email.trim();
    if (!mail || !password) {
      setError("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return;
    }
    if (!EMAIL_RE.test(mail)) {
      setError("Email không đúng định dạng.");
      return;
    }
    setBusy(true);
    try {
      await login(mail, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  if (user) return <Navigate to="/" replace />;
  return <AuthLayout><form className="auth-form" onSubmit={submit} noValidate><p className="text-xs font-bold uppercase text-primary">Chào mừng trở lại</p><h2 className="mb-2">Đăng nhập</h2><label className="field">Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" /></label><label className="field">Mật khẩu<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></label><div className="mt-2 text-right text-sm"><Link to="/quen-mat-khau" className="font-bold text-primary">Quên mật khẩu?</Link></div>{error && <p role="alert" className="mt-4 rounded-lg bg-peach px-4 py-3 text-sm font-medium text-clay">{error}</p>}{info && !error && <p role="status" className="mt-4 rounded-lg bg-sage px-4 py-3 text-sm font-medium text-primary">{info}</p>}<Button className="mt-6 w-full" type="submit" disabled={busy}>{busy ? "Đang xử lý…" : "Đăng nhập"}</Button><div className="mt-5 text-center text-sm text-muted-foreground">Chưa có tài khoản? <Link to="/dang-ky" className="font-bold text-primary">Đăng ký ngay</Link></div></form></AuthLayout>;
}

export default LoginPage;

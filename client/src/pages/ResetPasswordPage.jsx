import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/AuthLayout";
import { STRONG_RE } from "@/context/AuthContext";
import { resetPassword } from "@/services/authService";
function ResetPasswordPage() {
  const navigate = useNavigate();
  useEffect(() => { document.title = "Đặt lại mật khẩu | Sổ Mây"; }, []);
  const [params] = useSearchParams();
  const tokenFromUrl = params.get("token") ?? "";
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token.trim() || !password || !confirm) {
      setError("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return;
    }
    if (!STRONG_RE.test(password)) {
      setError("Mật khẩu tối thiểu 8 ký tự, gồm cả chữ và số.");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token.trim(), password);
      navigate("/dang-nhap?reset=true", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return <AuthLayout><form className="auth-form" onSubmit={submit} noValidate><p className="text-xs font-bold uppercase text-primary">Khôi phục tài khoản</p><h2 className="mb-2">Đặt lại mật khẩu</h2>{!tokenFromUrl && <label className="field">Mã đặt lại (token)<input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Dán mã đặt lại mật khẩu" /></label>}<label className="field">Mật khẩu mới<input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự, gồm chữ và số" /></label><label className="field">Xác nhận mật khẩu<input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Nhập lại mật khẩu" /></label>{error && <p role="alert" className="mt-4 rounded-lg bg-peach px-4 py-3 text-sm font-medium text-clay">{error}</p>}<Button className="mt-6 w-full" type="submit" disabled={busy}>{busy ? "Đang xử lý…" : "Đặt lại mật khẩu"}</Button><div className="mt-5 text-center text-sm text-muted-foreground"><Link to="/dang-nhap" className="font-bold text-primary">Quay lại đăng nhập</Link></div></form></AuthLayout>;
}

export default ResetPasswordPage;

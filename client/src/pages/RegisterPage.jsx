import { Link, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/AuthLayout";
import { EMAIL_RE, STRONG_RE, useAuth } from "@/context/AuthContext";
function RegisterPage() {
  const navigate = useNavigate();
  const { user, register } = useAuth();
  useEffect(() => { document.title = "Đăng ký | Sổ Mây"; }, []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const mail = email.trim();
    const fullName = name.trim();
    if (!fullName || !mail || !password || !confirm) {
      setError("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return;
    }
    if (fullName.length > 100) {
      setError("Họ tên tối đa 100 ký tự.");
      return;
    }
    if (!EMAIL_RE.test(mail)) {
      setError("Email không đúng định dạng.");
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
      await register(fullName, mail, password);
      await navigate("/dang-nhap?registered=true", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  if (user) return <Navigate to="/" replace />;
  return <AuthLayout><form className="auth-form" onSubmit={submit} noValidate><h2>Tạo tài khoản</h2><p className="mb-7 text-sm text-muted-foreground">Chỉ mất một phút để bắt đầu quản lý chi tiêu.</p><label className="field">Họ tên<input type="text" autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Minh Anh" /></label><label className="field">Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" /></label><label className="field">Mật khẩu<input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự, gồm chữ và số" /></label><label className="field">Xác nhận mật khẩu<input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Nhập lại mật khẩu" /></label>{error && <p role="alert" className="mt-4 rounded-lg bg-peach px-4 py-3 text-sm font-medium text-clay">{error}</p>}<Button className="mt-6 w-full" type="submit" disabled={busy}>{busy ? "Đang xử lý…" : "Đăng ký"}</Button><div className="mt-5 text-center text-sm text-muted-foreground">Đã có tài khoản? <Link to="/dang-nhap" className="font-bold text-primary">Đăng nhập</Link></div></form></AuthLayout>;
}

export default RegisterPage;

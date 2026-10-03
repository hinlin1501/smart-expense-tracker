import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/AuthLayout";
import { EMAIL_RE } from "@/context/AuthContext";
import { forgotPassword } from "@/services/authService";
function ForgotPasswordPage() {
  const navigate = useNavigate();
  useEffect(() => { document.title = "Quên mật khẩu | Sổ Mây"; }, []);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const mail = email.trim();
    if (!mail) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!EMAIL_RE.test(mail)) {
      setError("Email không đúng định dạng.");
      return;
    }
    setBusy(true);
    try {
      const data = await forgotPassword(mail);
      // Server chỉ trả resetToken khi email có tài khoản; chuyển thẳng sang bước đặt mật khẩu mới.
      if (!data.resetToken) {
        setError("Không tìm thấy tài khoản với email này.");
        return;
      }
      navigate(`/dat-lai-mat-khau?token=${encodeURIComponent(data.resetToken)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return <AuthLayout><form className="auth-form" onSubmit={submit} noValidate><p className="text-xs font-bold uppercase text-primary">Khôi phục tài khoản</p><h2>Quên mật khẩu</h2><p className="mb-7 text-sm text-muted-foreground">Nhập email đã đăng ký để tạo mật khẩu mới cho tài khoản của bạn.</p><label className="field">Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" /></label>{error && <p role="alert" className="mt-4 rounded-lg bg-peach px-4 py-3 text-sm font-medium text-clay">{error}</p>}<Button className="mt-6 w-full" type="submit" disabled={busy}>{busy ? "Đang xử lý…" : "Tiếp tục"}</Button><div className="mt-5 text-center text-sm text-muted-foreground">Nhớ mật khẩu rồi? <Link to="/dang-nhap" className="font-bold text-primary">Đăng nhập</Link></div></form></AuthLayout>;
}

export default ForgotPasswordPage;

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMAIL_RE, STRONG_RE, useAuth } from "@/context/AuthContext";
import { changePassword, updateProfile } from "@/services/authService";
const Alert = ({ m }) => m?.text ? <p role={m.type === "error" ? "alert" : "status"} className={m.type === "error" ? "mt-4 rounded-lg bg-peach px-4 py-3 text-sm font-medium text-clay" : "mt-4 rounded-lg bg-sage px-4 py-3 text-sm font-medium text-primary"}>{m.text}</p> : null;
function ProfilePage() {
  const { user, updateUser } = useAuth();
  useEffect(() => { document.title = "Tài khoản | Sổ Mây"; }, []);

  const [name, setName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passBusy, setPassBusy] = useState(false);
  const [passMsg, setPassMsg] = useState(null);

  const submitProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    const fullName = name.trim();
    const mail = email.trim();
    if (!fullName || !mail) {
      setProfileMsg({ type: "error", text: "Vui lòng nhập đầy đủ các trường bắt buộc." });
      return;
    }
    if (fullName.length > 100) {
      setProfileMsg({ type: "error", text: "Họ tên tối đa 100 ký tự." });
      return;
    }
    if (!EMAIL_RE.test(mail)) {
      setProfileMsg({ type: "error", text: "Email không đúng định dạng." });
      return;
    }
    setProfileBusy(true);
    try {
      const data = await updateProfile({ full_name: fullName, email: mail });
      updateUser(data.user);
      setProfileMsg({ type: "success", text: "Đã cập nhật thông tin cá nhân." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setProfileBusy(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPassMsg(null);
    if (!current || !next || !confirm) {
      setPassMsg({ type: "error", text: "Vui lòng nhập đầy đủ các trường bắt buộc." });
      return;
    }
    if (!STRONG_RE.test(next)) {
      setPassMsg({ type: "error", text: "Mật khẩu mới tối thiểu 8 ký tự, gồm cả chữ và số." });
      return;
    }
    if (next !== confirm) {
      setPassMsg({ type: "error", text: "Mật khẩu mới và xác nhận mật khẩu không khớp." });
      return;
    }
    if (next === current) {
      setPassMsg({ type: "error", text: "Mật khẩu mới phải khác mật khẩu hiện tại." });
      return;
    }
    setPassBusy(true);
    try {
      await changePassword(current, next);
      setPassMsg({ type: "success", text: "Đổi mật khẩu thành công." });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setPassMsg({ type: "error", text: err.message });
    } finally {
      setPassBusy(false);
    }
  };

  return <div className="min-h-screen bg-background text-foreground"><header className="sticky top-0 z-20 flex h-18 items-center border-b border-border bg-background/90 px-5 backdrop-blur lg:px-10"><Button variant="ghost" asChild><Link to="/"><ArrowLeft />Về tổng quan</Link></Button></header><main className="mx-auto max-w-2xl space-y-6 p-5 lg:p-10"><div className="mb-2"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">● Tài khoản</p><h1 className="font-display text-4xl font-semibold sm:text-5xl">Hồ sơ cá nhân</h1><p className="mt-2 text-muted-foreground">Quản lý thông tin và bảo mật tài khoản của bạn.</p></div><section className="panel"><div className="panel-head"><div><h2>Thông tin cá nhân</h2><p>Họ tên và email dùng để đăng nhập</p></div></div><form onSubmit={submitProfile} noValidate><label className="field mt-0">Họ tên<input type="text" autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label><label className="field">Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label><Alert m={profileMsg} /><div className="mt-6 flex justify-end"><Button type="submit" disabled={profileBusy}>{profileBusy ? "Đang lưu…" : "Lưu thông tin"}</Button></div></form></section><section className="panel"><div className="panel-head"><div><h2>Đổi mật khẩu</h2><p>Nhập mật khẩu hiện tại để xác nhận</p></div></div><form onSubmit={submitPassword} noValidate><label className="field mt-0">Mật khẩu hiện tại<input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></label><label className="field">Mật khẩu mới<input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Tối thiểu 8 ký tự, gồm chữ và số" /></label><label className="field">Xác nhận mật khẩu mới<input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label><Alert m={passMsg} /><div className="mt-6 flex justify-end"><Button type="submit" disabled={passBusy}>{passBusy ? "Đang xử lý…" : "Đổi mật khẩu"}</Button></div></form></section></main></div>;
}

export default ProfilePage;

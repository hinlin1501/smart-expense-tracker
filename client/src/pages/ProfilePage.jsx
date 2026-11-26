import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Info, Lock, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMAIL_RE, STRONG_RE, useAuth } from "@/context/AuthContext";
import { changePassword, updateProfile } from "@/services/authService";
const Alert = ({ m }) => m?.text ? <p role={m.type === "error" ? "alert" : "status"} className={m.type === "error" ? "mt-4 rounded-lg bg-peach px-4 py-3 text-sm font-medium text-clay" : "mt-4 rounded-lg bg-sage px-4 py-3 text-sm font-medium text-primary"}>{m.text}</p> : null;
const INPUT = "h-12! rounded-full! border-border! bg-background! px-5! text-[0.95rem] font-medium";
const Card = ({ icon: Icon, title, text, children }) => <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_oklch(.25_.03_70/.035)] sm:p-7"><span aria-hidden className="pointer-events-none absolute -right-14 -top-14 size-36 rounded-full bg-sage/60" /><div className="relative mb-5 flex items-center gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-sage text-primary"><Icon className="size-5" /></span><div><h2 className="font-display text-xl font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{text}</p></div></div><div className="relative">{children}</div></section>;
const PasswordField = ({ label, value, onChange, autoComplete, placeholder, first }) => {
  const [show, setShow] = useState(false);
  return <label className={"field" + (first ? " mt-0" : "")}>{label}<span className="relative block"><input className={INPUT + " w-full pr-12!"} type={show ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={onChange} placeholder={placeholder} /><button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <Eye className="size-[18px]" /> : <EyeOff className="size-[18px]" />}</button></span></label>;
};
function ProfilePage() {
  const { user, updateUser } = useAuth();
  useEffect(() => { document.title = "Tài khoản | Sổ Mây"; }, []);

  const [name, setName] = useState(user?.full_name ?? "");
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
    if (!fullName) {
      setProfileMsg({ type: "error", text: "Vui lòng nhập đầy đủ các trường bắt buộc." });
      return;
    }
    if (fullName.length > 100) {
      setProfileMsg({ type: "error", text: "Họ tên tối đa 100 ký tự." });
      return;
    }
   
    setProfileBusy(true);
    try {
      const data = await updateProfile({ full_name: fullName});
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

  return <div className="min-h-screen bg-background text-foreground"><header className="sticky top-0 z-20 flex h-18 items-center border-b border-border bg-background/90 px-5 backdrop-blur lg:px-10"><Button variant="ghost" asChild><Link to="/"><ArrowLeft />Về tổng quan</Link></Button></header><main className="mx-auto max-w-3xl space-y-6 p-5 lg:p-10"><div className="mb-2"><p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary"><span className="size-1.5 rounded-full bg-primary" />Tài khoản</p><h1 className="font-display text-4xl font-semibold text-primary sm:text-5xl">Hồ sơ cá nhân</h1><p className="mt-2 text-muted-foreground">Quản lý thông tin và bảo mật tài khoản của bạn.</p></div>
<Card icon={User} title="Thông tin cá nhân" text="Bạn có thể cập nhật họ tên. Email dùng để đăng nhập và không thể thay đổi."><form onSubmit={submitProfile} noValidate><label className="field mt-0">Họ tên<input className={INPUT} type="text" autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label><label className="field">Email<input className={INPUT + " cursor-not-allowed opacity-70"} type="email" autoComplete="email" value={user?.email ?? ""} readOnly disabled /></label><Alert m={profileMsg} /><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Info className="size-4" />Email không thể thay đổi.</p><Button type="submit" className="rounded-full" disabled={profileBusy}><Save />{profileBusy ? "Đang lưu…" : "Lưu thông tin"}</Button></div></form></Card>
<Card icon={Lock} title="Đổi mật khẩu" text="Nhập mật khẩu hiện tại và đặt mật khẩu mới của bạn."><form onSubmit={submitPassword} noValidate><PasswordField first label="Mật khẩu hiện tại" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /><PasswordField label="Mật khẩu mới" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Tối thiểu 8 ký tự, gồm chữ và số" /><PasswordField label="Xác nhận mật khẩu mới" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /><Alert m={passMsg} /><div className="mt-6 flex justify-end"><Button type="submit" className="rounded-full" disabled={passBusy}><Lock />{passBusy ? "Đang xử lý…" : "Đổi mật khẩu"}</Button></div></form></Card></main></div>;
}

export default ProfilePage;
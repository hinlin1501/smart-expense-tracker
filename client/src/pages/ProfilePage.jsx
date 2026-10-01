import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axiosClient from '../services/axiosClient';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [msgProfile, setMsgProfile] = useState('');
  const [msgPass, setMsgPass] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMsgProfile('');
    try {
      const res = await axiosClient.post('/auth/profile', { full_name: fullName, email });
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setMsgProfile('Information updated successfully!');
    } catch (err) {
      setMsgProfile(typeof err === 'string' ? err : 'Update failed');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsgPass('');
    try {
      const res = await axiosClient.post('/auth/change-password', { currentPassword, newPassword });
      setMsgPass(res.data.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setMsgPass(typeof err === 'string' ? err : 'Password change failed');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/dashboard">← Quay lại Dashboard</Link>
      <h2>Hồ Sơ Cá Nhân</h2>

      {/* Form Cập nhật thông tin */}
      <div style={{ border: '1px solid #ccc', padding: '15px', maxWidth: '400px', marginBottom: '20px' }}>
        <h4>Thông tin cá nhân</h4>
        {msgProfile && <p style={{ color: 'blue' }}>{msgProfile}</p>}
        <form onSubmit={handleUpdateProfile}>
          <div style={{ marginBottom: '10px' }}>
            <label>Họ tên: </label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Email: </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit">Lưu thông tin</button>
        </form>
      </div>

      {/* Form Đổi mật khẩu */}
      <div style={{ border: '1px solid #ccc', padding: '15px', maxWidth: '400px' }}>
        <h4>Đổi mật khẩu</h4>
        {msgPass && <p style={{ color: 'blue' }}>{msgPass}</p>}
        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: '10px' }}>
            <label>MK hiện tại: </label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>MK mới: </label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <button type="submit">Đổi mật khẩu</button>
        </form>
      </div>
    </div>
  );
}
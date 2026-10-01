import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axiosClient from '../services/axiosClient';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axiosClient.post('/auth/reset-password', { token, newPassword });
      alert(res.data.message || 'Password reset successfully!');
      navigate('/login');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Something went wrong');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc' }}>
      <h3>Đặt Lai Mật Khẩu</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Mã Reset Token: </label>
          <input 
            type="text" 
            value={token} 
            onChange={(e) => setToken(e.target.value)} 
            placeholder="Mã token từ email/link"
            required 
            style={{ width: '100%', padding: '6px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Mật khẩu mới: </label>
          <input 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            placeholder=">= 8 ký tự, gồm chữ & số" 
            required 
            style={{ width: '100%', padding: '6px' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '8px' }}>Xác nhận đổi MK</button>
      </form>

      <p style={{ marginTop: '15px' }}><Link to="/login">Quay lại Đăng nhập</Link></p>
    </div>
  );
}
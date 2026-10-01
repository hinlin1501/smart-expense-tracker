import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../services/axiosClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await axiosClient.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Something went wrong');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc' }}>
      <h3>Quên Mật Khẩu</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Nhập email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        <button type="submit" style={{ width: '100%', padding: '8px' }}>Gửi yêu cầu</button>
      </form>

      {resetToken && (
        <div style={{ marginTop: '15px', background: '#e6f7ff', border: '1px solid #91d5ff', padding: '10px' }}>
          <p style={{ margin: 0, color: '#1890ff' }}><strong>Link đặt lại mật khẩu (Kiểm thử):</strong></p>
          <p style={{ marginTop: '5px' }}>
            <Link to={`/reset-password?token=${resetToken}`}>
              Click vào đây để Đặt lại mật khẩu
            </Link>
          </p>
        </div>
      )}

      <p style={{ marginTop: '15px' }}><Link to="/login">Quay lại Đăng nhập</Link></p>
    </div>
  );
}
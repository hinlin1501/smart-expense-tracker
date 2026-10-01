import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard</h2>
      <p>Xin chào, <strong>{user?.full_name}</strong> ({user?.email})!</p>

      <div style={{ display: 'flex', gap: '15px', margin: '20px 0', padding: '10px', background: '#f0f0f0' }}>
        <Link to="/dashboard">Dashboard</Link> |
        <Link to="/expenses">Quản lý Chi tiêu</Link> |
        <Link to="/categories">Quản lý Danh mục</Link> |
        <Link to="/profile">Hồ sơ cá nhân</Link>
      </div>

      <button 
        onClick={logout} 
        style={{ backgroundColor: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
      >
        Đăng xuất
      </button>
    </div>
  );
}
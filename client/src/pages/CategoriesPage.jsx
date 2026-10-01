import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../services/axiosClient';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [error, setError] = useState('');

  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('#3b82f6');

  const parseErrorMessage = (err, fallbackMessage) => {
    return err?.response?.data?.message || (typeof err === 'string' ? err : fallbackMessage);
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get('/categories');
      setCategories(res.data.categories);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      await axiosClient.post('/categories', { 
        name: name.trim(), 
        icon, 
        color 
      });
      setName('');
      setIcon('');
      setColor('#3b82f6');
      fetchCategories();
    } catch (err) {
      setError(parseErrorMessage(err, 'Failed to create category'));
    }
  };

  const handleStartEdit = (cat) => {
    setError('');
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditIcon(cat.icon || '');
    setEditColor(cat.color || '#3b82f6');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    if (!editName || !editName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      await axiosClient.put(`/categories/${editingCategory.id}`, {
        name: editName.trim(),
        icon: editIcon,
        color: editColor
      });
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      setError(parseErrorMessage(err, 'Category update failed'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setError('');
    try {
      await axiosClient.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert(parseErrorMessage(err, 'Could not delete category'));
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/dashboard">← Quay lại Dashboard</Link>
      <h2>Quản Lý Danh Mục</h2>

      {error && (
        <div style={{ color: 'red', backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* FORM THÊM DANH MỤC */}
      <form onSubmit={handleCreate} style={{ border: '1px solid #ccc', padding: '15px', maxWidth: '450px', marginBottom: '20px' }}>
        <h4>Thêm danh mục mới</h4>
        <div style={{ marginBottom: '8px' }}>
          <label>Tên danh mục: </label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(''); // Xóa lỗi khi người dùng bắt đầu gõ
            }} 
            placeholder="Nhập tên danh mục"
          />
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label>Icon: </label>
          <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Nhập icon/emoji" />
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label>Màu sắc: </label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <button type="submit">Thêm danh mục</button>
      </form>

      {/* FORM SỬA DANH MỤC */}
      {editingCategory && (
        <form onSubmit={handleUpdate} style={{ border: '2px solid #ffc107', padding: '15px', maxWidth: '450px', marginBottom: '20px', background: '#fff9e6' }}>
          <h4>Đang sửa danh mục: {editingCategory.name}</h4>
          <div style={{ marginBottom: '8px' }}>
            <label>Tên danh mục: </label>
            <input 
              type="text" 
              value={editName} 
              onChange={(e) => {
                setEditName(e.target.value);
                if (error) setError('');
              }} 
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Icon: </label>
            <input type="text" value={editIcon} onChange={(e) => setEditIcon(e.target.value)} />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Màu sắc: </label>
            <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} />
          </div>
          <button type="submit">Lưu thay đổi</button>
          <button type="button" onClick={() => { setEditingCategory(null); setError(''); }} style={{ marginLeft: '10px' }}>Hủy</button>
        </form>
      )}

      {/* DANH SÁCH DANH MỤC */}
      <h4>Danh sách danh mục:</h4>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', maxWidth: '600px' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>Icon</th>
            <th>Tên danh mục</th>
            <th>Màu</th>
            <th>Loại</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td style={{ textAlign: 'center' }}>{cat.icon || '📁'}</td>
              <td>{cat.name}</td>
              <td style={{ textAlign: 'center' }}>
                <span style={{ display: 'inline-block', width: '16px', height: '16px', backgroundColor: cat.color || '#ccc', borderRadius: '50%' }}></span>
              </td>
              <td>{cat.is_default ? 'Mặc định' : 'Cá nhân'}</td>
              <td>
                {!cat.is_default ? (
                  <>
                    <button onClick={() => handleStartEdit(cat)} style={{ marginRight: '5px' }}>Sửa</button>
                    <button onClick={() => handleDelete(cat.id)}>Xóa</button>
                  </>
                ) : (
                  <small style={{ color: '#888' }}>Khoá</small>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../services/axiosClient';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  // 1. State Thêm mới
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // 2. State Lọc & Tìm kiếm
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // 3. State Phân trang
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // 4. State Chỉnh sửa
  const [editingExpense, setEditingExpense] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editExpenseDate, setEditExpenseDate] = useState('');
  const [editNote, setEditNote] = useState('');


  const parseErrorMessage = (err, fallbackMessage) => {
    return err?.response?.data?.message || (typeof err === 'string' ? err : fallbackMessage);
  };

  const fetchExpenses = async () => {
    try {
      const params = { page, limit };
      if (filterCategory) params.category_id = filterCategory;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (search) params.search = search;

      const res = await axiosClient.get('/expenses', { params });
      setExpenses(res.data.expenses);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(parseErrorMessage(err, 'Lỗi lấy danh sách chi tiêu'));
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get('/categories');
      setCategories(res.data.categories);
      if (res.data.categories.length > 0 && !categoryId) {
        setCategoryId(res.data.categories[0].id);
      }
    } catch (err) {
      setError(parseErrorMessage(err, 'Lỗi tải danh mục'));
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory, startDate, endDate, search, page, limit]);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setError('');
    setFilterCategory('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || Number(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!categoryId) {
      setError('Category is required');
      return;
    }
    if (!expenseDate) {
      setError('Expense date is required');
      return;
    }

    try {
      await axiosClient.post('/expenses', {
        amount: Number(amount),
        category_id: Number(categoryId),
        expense_date: expenseDate,
        note
      });
      setAmount('');
      setNote('');
      fetchExpenses();
    } catch (err) {
      setError(parseErrorMessage(err, 'Failed to add expense'));
    }
  };

  const handleStartEdit = (exp) => {
    setError('');
    setEditingExpense(exp);
    setEditAmount(exp.amount);
    setEditCategoryId(exp.category_id);
    setEditExpenseDate(exp.expense_date.split('T')[0]);
    setEditNote(exp.note || '');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    if (!editAmount || Number(editAmount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      await axiosClient.put(`/expenses/${editingExpense.id}`, {
        amount: Number(editAmount),
        category_id: Number(editCategoryId),
        expense_date: editExpenseDate,
        note: editNote
      });
      setEditingExpense(null);
      fetchExpenses();
    } catch (err) {
      setError(parseErrorMessage(err, ' Failed to update expense'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    setError('');
    try {
      await axiosClient.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      const msg = parseErrorMessage(err, 'Could not delete expense');
      setError(msg);
      alert(msg);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/dashboard">← Quay lại Dashboard</Link>
      <h2>Quản Lý Chi Tiêu</h2>

      {error && (
        <div style={{ 
          color: '#d9534f', 
          backgroundColor: '#f9f2f4', 
          border: '1px solid #ebccd1',
          padding: '10px 15px', 
          borderRadius: '4px', 
          marginBottom: '15px',
          fontWeight: 'bold'
        }}>
          ⚠️️ {error}
        </div>
      )}

      <form onSubmit={handleCreate} style={{ border: '1px solid #ccc', padding: '15px', maxWidth: '500px', marginBottom: '20px' }}>
        <h4>Thêm khoản chi tiêu mới</h4>
        <div style={{ marginBottom: '8px' }}>
          <label>Số tiền: </label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => { setAmount(e.target.value); if (error) setError(''); }} 
          />
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label>Danh mục: </label>
          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); if (error) setError(''); }}>
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label>Ngày: </label>
          <input 
            type="date" 
            value={expenseDate} 
            onChange={(e) => { setExpenseDate(e.target.value); if (error) setError(''); }} 
          />
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label>Ghi chú: </label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button type="submit">Thêm chi tiêu</button>
      </form>

      {/* BỘ LỌC & TÌM KIẾM */}
      <div style={{ border: '1px solid #007bff', padding: '15px', maxWidth: '800px', marginBottom: '20px', background: '#f8f9fa' }}>
        <h4>Bộ Lọc & Tìm Kiếm</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block' }}>Danh mục: </label>
            <select value={filterCategory} onChange={(e) => handleFilterChange(setFilterCategory, e.target.value)}>
              <option value="">-- Tất cả --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block' }}>Từ ngày: </label>
            <input type="date" value={startDate} onChange={(e) => handleFilterChange(setStartDate, e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block' }}>Đến ngày: </label>
            <input type="date" value={endDate} onChange={(e) => handleFilterChange(setEndDate, e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block' }}>Ghi chú: </label>
            <input type="text" placeholder="Tìm theo ghi chú..." value={search} onChange={(e) => handleFilterChange(setSearch, e.target.value)} />
          </div>
          <button type="button" onClick={handleClearFilters} style={{ height: '30px' }}>
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* FORM SỬA CHI TIÊU */}
      {editingExpense && (
        <form onSubmit={handleUpdate} style={{ border: '2px solid #ffc107', padding: '15px', maxWidth: '500px', marginBottom: '20px', background: '#fff9e6' }}>
          <h4>Đang sửa khoản chi tiêu (ID: {editingExpense.id})</h4>
          <div style={{ marginBottom: '8px' }}>
            <label>Số tiền: </label>
            <input 
              type="number" 
              value={editAmount} 
              onChange={(e) => { setEditAmount(e.target.value); if (error) setError(''); }} 
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Danh mục: </label>
            <select value={editCategoryId} onChange={(e) => { setEditCategoryId(e.target.value); if (error) setError(''); }}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Ngày: </label>
            <input 
              type="date" 
              value={editExpenseDate} 
              onChange={(e) => { setEditExpenseDate(e.target.value); if (error) setError(''); }} 
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Ghi chú: </label>
            <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
          </div>
          <button type="submit">Lưu thay đổi</button>
          <button type="button" onClick={() => { setEditingExpense(null); setError(''); }} style={{ marginLeft: '10px' }}>Hủy</button>
        </form>
      )}

      {/* DANH SÁCH BẢNG */}
      <h4>Danh sách chi tiêu (Tổng số: {pagination.total})</h4>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', maxWidth: '800px' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>Ngày</th>
            <th>Danh mục</th>
            <th>Số tiền</th>
            <th>Ghi chú</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>Không có dữ liệu chi tiêu nào</td></tr>
          ) : (
            expenses.map((exp) => (
              <tr key={exp.id}>
                <td>{new Date(exp.expense_date).toLocaleDateString('vi-VN')}</td>
                <td>{exp.category?.name}</td>
                <td>{Number(exp.amount).toLocaleString('vi-VN')} đ</td>
                <td>{exp.note || '-'}</td>
                <td>
                  <button onClick={() => handleStartEdit(exp)} style={{ marginRight: '5px' }}>Sửa</button>
                  <button onClick={() => handleDelete(exp.id)}>Xóa</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* CỤM PHÂN TRANG */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '15px', maxWidth: '800px' }}>
        <div>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Trang trước
          </button>
          <span style={{ margin: '0 10px' }}>
            Trang <strong>{pagination.page || 1}</strong> / {pagination.totalPages || 1}
          </span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
            Trang sau →
          </button>
        </div>

        <div>
          <label>Hiển thị: </label>
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
            <option value={5}>5 / trang</option>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
          </select>
        </div>
      </div>
    </div>
  );
}
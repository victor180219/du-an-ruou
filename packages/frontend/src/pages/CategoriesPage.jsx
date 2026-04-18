import { useState, useEffect } from 'react';
import api from '../lib/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', sortOrder: 0 });

  const fetch = async () => {
    const { data } = await api.get('/categories');
    setCategories(data);
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', sortOrder: 0 }); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || '', sortOrder: c.sortOrder }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
        toast.success('Đã cập nhật danh mục');
      } else {
        await api.post('/categories', form);
        toast.success('Đã thêm danh mục');
      }
      setModalOpen(false);
      fetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi');
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Xóa danh mục "${c.name}"?`)) return;
    try {
      await api.delete(`/categories/${c.id}`);
      toast.success('Đã xóa danh mục');
      fetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi xóa');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Danh mục sản phẩm</h1>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Thêm danh mục
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Tên danh mục</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Mô tả</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Số SP</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Thứ tự</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{c.description || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {c._count?.products || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-500">{c.sortOrder}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400">Chưa có danh mục</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên danh mục *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              required className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Thứ tự sắp xếp</label>
            <input type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Hủy</button>
            <button type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
              {editing ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

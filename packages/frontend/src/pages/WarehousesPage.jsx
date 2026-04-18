import { useState, useEffect } from 'react';
import api from '../lib/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Pencil, MapPin } from 'lucide-react';

const branchLabels = { HN: 'Hà Nội', HCM: 'TP.HCM' };
const typeLabels = { retail: 'Bán lẻ', wholesale: 'Bán buôn' };

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'retail', branch: 'HN', address: '', managerName: '' });

  const fetch = async () => {
    const { data } = await api.get('/warehouses');
    setWarehouses(data);
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', type: 'retail', branch: 'HN', address: '', managerName: '' }); setModalOpen(true); };
  const openEdit = (w) => { setEditing(w); setForm({ name: w.name, type: w.type, branch: w.branch, address: w.address || '', managerName: w.managerName || '' }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/warehouses/${editing.id}`, form);
        toast.success('Đã cập nhật kho');
      } else {
        await api.post('/warehouses', form);
        toast.success('Đã thêm kho');
      }
      setModalOpen(false);
      fetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Kho hàng</h1>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Thêm kho
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {warehouses.map(w => (
          <div key={w.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-slate-900">{w.name}</h3>
              <button onClick={() => openEdit(w)} className="p-1 text-slate-400 hover:text-blue-600">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${w.type === 'retail' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                  {typeLabels[w.type]}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                  {branchLabels[w.branch]}
                </span>
              </div>
              {w.address && (
                <p className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3.5 h-3.5" /> {w.address}
                </p>
              )}
              <p className="text-slate-400 text-xs">{w._count?.inventory || 0} mặt hàng trong kho</p>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Sửa kho' : 'Thêm kho'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên kho *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              required className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại kho *</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="retail">Bán lẻ</option>
                <option value="wholesale">Bán buôn</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chi nhánh *</label>
              <select value={form.branch} onChange={e => setForm({...form, branch: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="HN">Hà Nội</option>
                <option value="HCM">TP.HCM</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
            <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Người quản lý</label>
            <input type="text" value={form.managerName} onChange={e => setForm({...form, managerName: e.target.value})}
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

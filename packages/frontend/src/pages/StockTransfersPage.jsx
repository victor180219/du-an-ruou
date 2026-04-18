import { useState, useEffect } from 'react';
import api from '../lib/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, CheckCircle, Trash2 } from 'lucide-react';

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);

  const [form, setForm] = useState({ fromWarehouseId: '', toWarehouseId: '', notes: '' });
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);

  const fetch = async () => {
    const { data } = await api.get('/stock-transfers');
    setTransfers(data.data);
  };

  useEffect(() => {
    fetch();
    api.get('/warehouses').then(({ data }) => setWarehouses(data));
    api.get('/products?limit=200').then(({ data }) => setProducts(data.data));
  }, []);

  const addItem = () => setItems([...items, { productId: '', quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const newItems = [...items];
    newItems[i][field] = val;
    setItems(newItems);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const validItems = items.filter(i => i.productId && i.quantity > 0);
    if (!form.fromWarehouseId || !form.toWarehouseId || validItems.length === 0) {
      return toast.error('Vui lòng điền đầy đủ thông tin');
    }
    try {
      await api.post('/stock-transfers', { ...form, items: validItems });
      toast.success('Đã tạo phiếu chuyển kho');
      setCreateOpen(false);
      setForm({ fromWarehouseId: '', toWarehouseId: '', notes: '' });
      setItems([{ productId: '', quantity: 1 }]);
      fetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi tạo phiếu chuyển');
    }
  };

  const handleComplete = async (id) => {
    if (!confirm('Xác nhận hoàn thành chuyển kho?')) return;
    try {
      await api.put(`/stock-transfers/${id}/complete`);
      toast.success('Đã hoàn thành chuyển kho');
      fetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi hoàn thành');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Chuyển kho</h1>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Tạo phiếu chuyển
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Mã phiếu</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Kho xuất</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Kho nhận</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Số SP</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Ngày tạo</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transfers.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-blue-600">{t.transferCode}</td>
                  <td className="px-4 py-3">{t.fromWarehouse?.name}</td>
                  <td className="px-4 py-3">{t.toWarehouse?.name}</td>
                  <td className="px-4 py-3 text-center">{t._count?.items || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {t.status === 'completed' ? 'Hoàn thành' : 'Chờ xử lý'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-center">
                    {t.status === 'pending' && (
                      <button onClick={() => handleComplete(t.id)} className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded" title="Hoàn thành">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Chưa có phiếu chuyển kho</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Tạo phiếu chuyển kho" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kho xuất *</label>
              <select value={form.fromWarehouseId} onChange={e => setForm({...form, fromWarehouseId: e.target.value})}
                required className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="">— Chọn —</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kho nhận *</label>
              <select value={form.toWarehouseId} onChange={e => setForm({...form, toWarehouseId: e.target.value})}
                required className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="">— Chọn —</option>
                {warehouses.filter(w => String(w.id) !== form.fromWarehouseId).map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sản phẩm chuyển</label>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    {i === 0 && <label className="block text-xs text-slate-500 mb-1">Sản phẩm</label>}
                    <select value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)}
                      className="w-full px-2 py-2 border rounded-lg text-sm bg-white">
                      <option value="">— Chọn —</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    {i === 0 && <label className="block text-xs text-slate-500 mb-1">Số lượng</label>}
                    <input type="number" min="1" value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-2 border rounded-lg text-sm" />
                  </div>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium">
              + Thêm sản phẩm
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Hủy</button>
            <button type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
              Tạo phiếu chuyển
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../lib/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Eye, Trash2 } from 'lucide-react';

function formatVND(v) {
  return Number(v || 0).toLocaleString('vi-VN') + 'đ';
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const [form, setForm] = useState({ supplierId: '', warehouseId: '', notes: '' });
  const [items, setItems] = useState([{ productId: '', quantity: 1, unitCost: 0 }]);

  const fetch = async () => {
    const { data } = await api.get('/purchase-orders');
    setOrders(data.data);
  };

  useEffect(() => {
    fetch();
    api.get('/suppliers').then(({ data }) => setSuppliers(data));
    api.get('/warehouses').then(({ data }) => setWarehouses(data));
    api.get('/products?limit=200').then(({ data }) => setProducts(data.data));
  }, []);

  const addItem = () => setItems([...items, { productId: '', quantity: 1, unitCost: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const newItems = [...items];
    newItems[i][field] = val;
    setItems(newItems);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const validItems = items.filter(i => i.productId && i.quantity > 0 && i.unitCost > 0);
    if (!form.supplierId || !form.warehouseId || validItems.length === 0) {
      return toast.error('Vui lòng điền đầy đủ thông tin');
    }
    try {
      await api.post('/purchase-orders', { ...form, items: validItems });
      toast.success('Đã tạo phiếu nhập hàng');
      setCreateOpen(false);
      setForm({ supplierId: '', warehouseId: '', notes: '' });
      setItems([{ productId: '', quantity: 1, unitCost: 0 }]);
      fetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi tạo phiếu nhập');
    }
  };

  const viewDetail = async (id) => {
    const { data } = await api.get(`/purchase-orders/${id}`);
    setDetail(data);
    setDetailOpen(true);
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Nhập hàng</h1>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Tạo phiếu nhập
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Mã phiếu</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Nhà cung cấp</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Kho nhập</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Tổng tiền</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Ngày tạo</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-blue-600">{o.poCode}</td>
                  <td className="px-4 py-3">{o.supplier?.name}</td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{o.warehouse?.name}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatVND(o.totalAmount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      o.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {o.status === 'completed' ? 'Hoàn thành' : 'Nháp'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => viewDetail(o.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Chưa có phiếu nhập hàng</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Tạo phiếu nhập hàng" size="xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp *</label>
              <select value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}
                required className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="">— Chọn —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kho nhập *</label>
              <select value={form.warehouseId} onChange={e => setForm({...form, warehouseId: e.target.value})}
                required className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="">— Chọn —</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sản phẩm nhập</label>
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
                    {i === 0 && <label className="block text-xs text-slate-500 mb-1">SL</label>}
                    <input type="number" min="1" value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="w-36">
                    {i === 0 && <label className="block text-xs text-slate-500 mb-1">Đơn giá nhập</label>}
                    <input type="number" min="0" value={item.unitCost}
                      onChange={e => updateItem(i, 'unitCost', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="w-32 text-right text-sm font-medium py-2">
                    {formatVND(item.quantity * item.unitCost)}
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

          <div className="text-right text-lg font-bold text-slate-900">
            Tổng: {formatVND(totalAmount)}
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
              Tạo phiếu nhập
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={`Phiếu nhập: ${detail?.poCode}`} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">NCC:</span> <span className="font-medium">{detail.supplier?.name}</span></div>
              <div><span className="text-slate-500">Kho:</span> <span className="font-medium">{detail.warehouse?.name}</span></div>
              <div><span className="text-slate-500">Người tạo:</span> <span className="font-medium">{detail.creator?.fullName}</span></div>
              <div><span className="text-slate-500">Ngày:</span> <span className="font-medium">{new Date(detail.createdAt).toLocaleDateString('vi-VN')}</span></div>
            </div>
            <table className="w-full text-sm border">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2">Sản phẩm</th>
                  <th className="text-right px-3 py-2">SL</th>
                  <th className="text-right px-3 py-2">Đơn giá</th>
                  <th className="text-right px-3 py-2">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {detail.items?.map(item => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">{item.product?.name}</td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">{formatVND(item.unitCost)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatVND(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right font-bold">Tổng cộng:</td>
                  <td className="px-3 py-2 text-right font-bold text-lg">{formatVND(detail.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
            {detail.notes && <p className="text-sm text-slate-500"><strong>Ghi chú:</strong> {detail.notes}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}

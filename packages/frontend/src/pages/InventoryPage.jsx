import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Search, AlertTriangle } from 'lucide-react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const params = { search: search || undefined, warehouseId: warehouseId || undefined, limit: 100 };
      const { data } = await api.get('/inventory', { params });
      setInventory(data.data);
      setTotal(data.total);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    api.get('/warehouses').then(({ data }) => setWarehouses(data));
  }, []);

  useEffect(() => { fetch(); }, [search, warehouseId]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Tồn kho ({total})</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Tìm sản phẩm..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
        </div>
        <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          <option value="">Tất cả kho</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Sản phẩm</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Kho</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Tồn kho</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Tối thiểu</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventory.map(item => {
                const isLow = item.minQuantity > 0 && item.quantity <= item.minQuantity;
                return (
                  <tr key={item.id} className={`hover:bg-slate-50 ${isLow ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.product?.sku}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.product?.name}</td>
                    <td className="px-4 py-3 text-slate-500">{item.warehouse?.name}</td>
                    <td className="px-4 py-3 text-right font-bold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell">{item.minQuantity}</td>
                    <td className="px-4 py-3 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" /> Sắp hết
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">Đủ hàng</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {inventory.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">
                  {loading ? 'Đang tải...' : 'Chưa có dữ liệu tồn kho'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

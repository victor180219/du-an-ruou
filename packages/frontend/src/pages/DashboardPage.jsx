import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Package, Tags, Warehouse, ClipboardList, AlertTriangle, FileDown, ArrowLeftRight } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(({ data }) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10 text-slate-500">Đang tải...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Tổng quan</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Sản phẩm" value={stats?.productCount || 0} color="bg-blue-500" />
        <StatCard icon={Tags} label="Danh mục" value={stats?.categoryCount || 0} color="bg-purple-500" />
        <StatCard icon={Warehouse} label="Kho hàng" value={stats?.warehouseCount || 0} color="bg-emerald-500" />
        <StatCard icon={ClipboardList} label="Tổng tồn kho" value={stats?.totalInventory || 0} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={AlertTriangle} label="Sắp hết hàng" value={stats?.lowStockCount || 0} color="bg-red-500" />
        <StatCard icon={FileDown} label="Phiếu nhập hàng" value={stats?.poCount || 0} color="bg-cyan-500" />
        <StatCard icon={ArrowLeftRight} label="Phiếu chuyển kho" value={stats?.transferCount || 0} color="bg-indigo-500" />
      </div>
    </div>
  );
}

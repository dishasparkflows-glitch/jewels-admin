import { statCards } from '../../data/dashboardData';
import StatCard from '../../components/dashboard/StatCard';
import SalesChart from '../../components/dashboard/SalesChart';
import OrderActivityChart from '../../components/dashboard/OrderActivityChart';
import OrdersTable from '../../components/dashboard/OrdersTable';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* ─── Page Title ─────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Analytics Overview
        </h1>
        <p className="text-xs text-stone-400 mt-1">
          Welcome back to Neirah Jewellers management portal.
        </p>
      </div>

      {/* ─── Key Metrics Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card) => (
          <StatCard key={card.id} {...card} />
        ))}
      </div>

      {/* ─── Charts Section ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <SalesChart />
        </div>
        <div className="lg:col-span-4">
          <OrderActivityChart />
        </div>
      </div>

      {/* ─── Recent Orders Table ────────────────────────────── */}
      <OrdersTable />
    </div>
  );
};

export default Dashboard;

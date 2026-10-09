import ModuleHeader from '../../components/common/ModuleHeader';
import { statCards } from '../../data/dashboardData';
import StatCard from '../../components/dashboard/StatCard';
import SalesChart from '../../components/dashboard/SalesChart';
import OrderActivityChart from '../../components/dashboard/OrderActivityChart';
import OrdersTable from '../../components/dashboard/OrdersTable';

const Dashboard = () => {
  return (
    <div className="space-y-2.5">
      {/* ─── Page Title ─────────────────────────────────────── */}
      <ModuleHeader
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Dashboard' },
        ]}
        title="Analytics Overview"
        subtitle="Welcome back to Neirah Jewellers management portal."
      />

      {/* ─── Key Metrics Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {statCards.map((card) => (
          <StatCard key={card.id} {...card} />
        ))}
      </div>

      {/* ─── Charts Section ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
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

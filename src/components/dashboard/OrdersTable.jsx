import { Link } from 'react-router-dom';
import { recentOrders } from '../../data/dashboardData';

const OrdersTable = () => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/70 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-stone-900 text-base">Recent Orders</h3>
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mt-0.5">
            Showing last 5 orders only
          </p>
        </div>
        <Link
          to="/orders"
          className="text-xs font-semibold text-[#8b6f4e] hover:text-[#735839] flex items-center gap-1 transition-colors uppercase tracking-wider"
        >
          <span>View All Orders</span>
          <span className="text-sm font-bold">›</span>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">Order ID</th>
              <th className="pb-3 font-semibold">Customer</th>
              <th className="pb-3 font-semibold">Items</th>
              <th className="pb-3 font-semibold">Amount</th>
              <th className="pb-3 font-semibold text-right">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {recentOrders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-[#fcfaf7] transition-colors duration-150 group"
              >
                <td className="py-4 font-bold text-stone-900 tracking-tight text-sm">
                  {order.id}
                </td>
                <td className="py-4 text-stone-700 font-medium">
                  {order.customer}
                </td>
                <td className="py-4 text-stone-500 font-normal">
                  {order.items}
                </td>
                <td className="py-4 font-semibold text-stone-900">
                  {order.amount}
                </td>
                <td className="py-4 text-right">
                  <span className="badge-paid">
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTable;

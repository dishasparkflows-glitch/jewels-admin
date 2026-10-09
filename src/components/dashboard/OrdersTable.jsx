import { Link } from 'react-router-dom';
import { recentOrders } from '../../data/dashboardData';

const OrdersTable = () => {
  return (
    <div className="bg-white rounded-lg border border-stone-200/70 p-3.5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-stone-900 text-sm font-serif">Recent Orders</h3>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
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
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-stone-100 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="py-2 px-2 text-center w-12">SR NO</th>
              <th className="py-2 px-3">Order ID</th>
              <th className="py-2 px-3">Customer</th>
              <th className="py-2 px-3">Items</th>
              <th className="py-2 px-3">Amount</th>
              <th className="py-2 px-3 text-right">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50 text-xs">
            {recentOrders.map((order, idx) => (
              <tr
                key={order.id}
                className="hover:bg-[#fcfaf7] transition-colors duration-150 group"
              >
                <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                  {idx + 1}
                </td>
                <td className="py-2.5 px-3 font-bold text-stone-900 tracking-tight">
                  {order.id}
                </td>
                <td className="py-2.5 px-3 text-stone-700 font-medium">
                  {order.customer}
                </td>
                <td className="py-2.5 px-3 text-stone-500">
                  {order.items}
                </td>
                <td className="py-2.5 px-3 font-semibold text-stone-900">
                  {order.amount}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="badge-paid text-[10px] px-2 py-0.5">
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

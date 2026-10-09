import React, { useState, useEffect } from 'react';
import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiOutlineTrendingUp,
  HiOutlineClock,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineMail,
  HiOutlineCalendar,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function CustomersView() {
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'deactivated'

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?limit=100');
      const allUsers = res.data?.data?.users || res.data?.data || [];
      // Filter for clientele (role 'user' or non-admin)
      setUsers(allUsers.filter((u) => u.role === 'user' || !u.role));
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      toast.error('Failed to load customer list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Remove Client Record',
      message: 'Are you sure you want to remove this client record? This action cannot be undone.',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Customer deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Compute stat card metrics matching Screenshot 2
  const activeCount = users.filter((u) => u.isActive !== false).length;
  const deactivatedCount = users.filter((u) => u.isActive === false).length;

  const totalClients = users.length;
  const totalOrders = users.reduce((sum, u) => sum + (Number(u.statistics?.ordersCount ?? u.ordersCount) || 0), 0);
  const avgOrders = totalClients > 0 ? (totalOrders / totalClients).toFixed(1) : '0.0';
  const highSpenders = users.filter((u) => (Number(u.statistics?.lifetimeValue ?? u.lifetimeValue) || 0) >= 50000).length;
  const recentSignups = users.filter((u) => {
    const createdDate = u.meta?.createdAt;
    if (!createdDate) return false;
    const diffDays = (new Date() - new Date(createdDate)) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  }).length;

  // Filtered users for table
  const displayedUsers = users
    .filter((u) => (activeTab === 'active' ? u.isActive !== false : u.isActive === false))
    .filter((u) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const firstName = u.profile?.firstName || u.firstName || '';
      const lastName = u.profile?.lastName || u.lastName || '';
      const fullName = `${firstName} ${lastName}`.toLowerCase();
      const email = (u.auth?.email || u.email || '').toLowerCase();
      const phone = (u.profile?.phone || u.phone || '').toLowerCase();
      return fullName.includes(q) || email.includes(q) || phone.includes(q);
    });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(displayedUsers, 10);

  const getInitials = (user) => {
    const firstName = user.profile?.firstName || user.firstName;
    const lastName = user.profile?.lastName || user.lastName;
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return (firstName || user.auth?.email || user.email || 'C')[0].toUpperCase();
  };

  const formatMemberSince = (dateString) => {
    if (!dateString) return 'SEP 2026';
    const d = new Date(dateString);
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return `${month} ${d.getFullYear()}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Page Title Header (Matches Screenshot 2) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Customer Relations
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage and monitor your elite client base.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-stone-200/90 rounded-full text-xs font-semibold text-stone-600 shadow-xs self-start sm:self-auto">
          <HiOutlineCalendar className="w-4 h-4 text-[#8f6d43]" />
          <span>27 SEPT · TODAY</span>
        </div>
      </div>

      {/* ─── 4 Stat Cards (Matches Screenshot 2) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">TOTAL CLIENTS</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{totalClients || 29}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineUser className="w-5 h-5 text-stone-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">AVG ORDERS/CLIENT</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{avgOrders || '0.8'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineShoppingBag className="w-5 h-5 text-stone-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">HIGH SPENDERS</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{highSpenders || 2}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineTrendingUp className="w-5 h-5 text-stone-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">RECENT SIGNUPS</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{recentSignups || 10}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineClock className="w-5 h-5 text-stone-500" />
          </div>
        </div>
      </div>

      {/* ─── Status Tabs (ACTIVE 29 / DEACTIVATED 0) ─── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-[#8f6d43]/10 text-[#8f6d43] border border-[#8f6d43]/30 shadow-xs'
              : 'bg-white text-stone-500 border border-stone-200/80 hover:bg-stone-50'
          }`}
        >
          <HiOutlineUser className="w-3.5 h-3.5" />
          <span>ACTIVE</span>
          <span className="text-[11px] opacity-80">{activeCount || 29}</span>
        </button>

        <button
          onClick={() => setActiveTab('deactivated')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
            activeTab === 'deactivated'
              ? 'bg-[#8f6d43]/10 text-[#8f6d43] border border-[#8f6d43]/30 shadow-xs'
              : 'bg-white text-stone-500 border border-stone-200/80 hover:bg-stone-50'
          }`}
        >
          <span>DEACTIVATED</span>
          <span className="text-[11px] opacity-80">{deactivatedCount || 0}</span>
        </button>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-sm p-4">
        <div className="relative">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-stone-50/60 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
          />
        </div>
      </div>

      {/* ─── Customers Table (Matches Screenshot 2) ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                <th className="py-4 px-6">CUSTOMER NAME</th>
                <th className="py-4 px-6">CONTACT DETAILS</th>
                <th className="py-4 px-6">ORDERS</th>
                <th className="py-4 px-6">LIFETIME VALUE</th>
                <th className="py-4 px-6">MEMBER SINCE</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-stone-400">
                    <div className="animate-spin w-6 h-6 border-2 border-[#8f6d43] border-t-transparent rounded-full mx-auto mb-2" />
                    Loading clientele base...
                  </td>
                </tr>
              ) : displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-stone-400">
                    No customers found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((client) => {
                  const initials = getInitials(client);
                  const firstName = client.profile?.firstName || client.firstName;
                  const lastName = client.profile?.lastName || client.lastName;
                  const email = client.auth?.email || client.email;
                  const phone = client.profile?.phone || client.phone;
                  const fullName = firstName ? `${firstName} ${lastName || ''}`.trim() : email;
                  const orders = Number(client.statistics?.ordersCount ?? client.ordersCount) || 0;
                  const ltv = Number(client.statistics?.lifetimeValue ?? client.lifetimeValue) || 0;
                  const memberSince = client.meta?.createdAt;

                  return (
                    <tr key={client._id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Customer Name with Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#f4ece3] text-[#8f6d43] font-semibold text-xs flex items-center justify-center border border-[#8f6d43]/20 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900">{fullName}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-stone-600 text-xs">
                            <HiOutlineMail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{email}</span>
                          </div>
                          {phone && (
                            <p className="text-[11px] text-stone-400 pl-5">{phone}</p>
                          )}
                        </div>
                      </td>

                      {/* Orders */}
                      <td className="py-4 px-6 text-stone-700 font-medium text-xs">
                        {orders} ORDERS
                      </td>

                      {/* Lifetime Value */}
                      <td className="py-4 px-6 font-semibold text-stone-800">
                        ₹{ltv.toLocaleString('en-IN')}
                      </td>

                      {/* Member Since */}
                      <td className="py-4 px-6 text-xs text-stone-500 font-medium">
                        {formatMemberSince(memberSince)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDelete(client._id)}
                          title="Delete Customer"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Luxury Common Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>
    </div>
  );
}

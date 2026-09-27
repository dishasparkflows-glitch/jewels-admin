import {
  HiOutlineTrendingUp,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineCube,
} from 'react-icons/hi';

export const statCards = [
  {
    id: 'revenue',
    label: 'TOTAL REVENUE',
    value: '₹45,827.03',
    change: '+100%',
    subtext: 'vs last month',
    trend: 'up',
    icon: HiOutlineTrendingUp,
  },
  {
    id: 'orders',
    label: 'TOTAL ORDERS',
    value: '8',
    change: '+100%',
    subtext: 'vs last month',
    trend: 'up',
    icon: HiOutlineClipboardList,
  },
  {
    id: 'customers',
    label: 'TOTAL CUSTOMERS',
    value: '30',
    change: '+25.0%',
    subtext: 'vs last month',
    trend: 'up',
    icon: HiOutlineUserGroup,
  },
  {
    id: 'products',
    label: 'PRODUCTS COUNT',
    value: '195',
    change: '+8%',
    subtext: 'vs last month',
    trend: 'up',
    icon: HiOutlineCube,
  },
];

export const salesPerformance = {
  currency: '₹',
  yTicks: ['₹50.0k', '₹40.0k', '₹30.0k', '₹10.0k', '₹0'],
  points: [
    { month: 'Mar', value: 1200 },
    { month: 'Apr', value: 1500 },
    { month: 'May', value: 1300 },
    { month: 'Jun', value: 1800 },
    { month: 'Jul', value: 2400 },
    { month: 'Aug', value: 4200 },
    { month: 'Sep', value: 45827.03 },
  ],
};

export const weeklyOrderActivity = [
  { day: 'Mon', count: 0 },
  { day: 'Tue', count: 0 },
  { day: 'Wed', count: 2 },
  { day: 'Thu', count: 2 },
  { day: 'Fri', count: 8 },
  { day: 'Sat', count: 4 },
  { day: 'Sun', count: 0 },
];

export const recentOrders = [
  {
    id: '#ORD-8CB4',
    customer: 'Krushnakant Jayswal',
    items: '3 Items',
    amount: '₹26,882.50',
    status: 'PAID',
    date: 'Today, 10:45 AM',
  },
  {
    id: '#ORD-6096',
    customer: 'Krushnakant Jayswal',
    items: '2 Items',
    amount: '₹22,353.50',
    status: 'PAID',
    date: 'Today, 09:30 AM',
  },
  {
    id: '#ORD-3130',
    customer: 'Krushnakant Jayswal',
    items: '1 Items',
    amount: '₹12,453.50',
    status: 'PAID',
    date: 'Yesterday, 04:12 PM',
  },
  {
    id: '#ORD-3103',
    customer: 'Krushnakant Jayswal',
    items: '1 Items',
    amount: '₹12,453.50',
    status: 'PAID',
    date: 'Yesterday, 02:18 PM',
  },
  {
    id: '#ORD-30D2',
    customer: 'Krushnakant Jayswal',
    items: '1 Items',
    amount: '₹12,453.50',
    status: 'PAID',
    date: '25 Sep, 11:05 AM',
  },
];

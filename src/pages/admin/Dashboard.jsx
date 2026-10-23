import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ModuleHeader from '../../components/common/ModuleHeader';
import GoogleAnalyticsSection from '../../components/analytics/GoogleAnalyticsSection';
import api from '../../api/axios';

const metrics = [
  { label: 'Products', endpoint: '/products', path: '/catalog/jewelry-products' },
  { label: 'Categories', endpoint: '/categories', path: '/catalog/categories' },
  { label: 'Customers', endpoint: '/users', params: { role: 'user' }, path: '/customers' },
  { label: 'Reviews', endpoint: '/reviews', path: '/reviews' },
];

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    Promise.allSettled(metrics.map((metric) => api.get(metric.endpoint, { params: { ...metric.params, limit: 1 }, signal: controller.signal })))
      .then((results) => {
        if (controller.signal.aborted) return;
        setCounts(Object.fromEntries(results.map((result, index) => [metrics[index].label, result.status === 'fulfilled' ? result.value.data?.pagination?.totalDocs ?? null : null])));
        setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  return (
    <div className="space-y-6">
      <ModuleHeader breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Dashboard' }]} title="Overview" subtitle="Current records and live performance from your store." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map((metric) => <Link key={metric.label} to={metric.path} className="rounded-2xl border border-stone-200 bg-white p-5"><p className="text-sm text-stone-500">{metric.label}</p><p className="mt-3 text-2xl font-semibold">{loading ? 'Loading…' : counts[metric.label] == null ? 'Unavailable' : counts[metric.label].toLocaleString()}</p></Link>)}</div>
      {!loading && Object.values(counts).some((count) => count == null) && <button onClick={() => setRevision((value) => value + 1)} className="text-sm text-[#8b6f4e] underline">Retry unavailable metrics</button>}
      
      {/* ─── Google Analytics 4 Performance & Reporting ─── */}
      <GoogleAnalyticsSection />
    </div>
  );
}

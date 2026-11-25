import ModuleHeader from '../../components/common/ModuleHeader';
import GoogleAnalyticsSection from '../../components/analytics/GoogleAnalyticsSection';

export default function AnalyticsView() {
  return (
    <div className="space-y-5">
      <ModuleHeader
        title="Google Analytics 4 Reports"
        subtitle="Real-time visitors, user acquisition channels, and product engagement insights."
      />

      <GoogleAnalyticsSection isStandalone />
    </div>
  );
}

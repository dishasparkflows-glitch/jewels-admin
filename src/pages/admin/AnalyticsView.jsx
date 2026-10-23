import React from 'react';
import ModuleHeader from '../../components/common/ModuleHeader';
import GoogleAnalyticsSection from '../../components/analytics/GoogleAnalyticsSection';

export default function AnalyticsView() {
  return (
    <div className="space-y-5">
      <ModuleHeader
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Google Analytics' },
        ]}
        title="Google Analytics 4 Reports"
        subtitle="Real-time visitors, user acquisition channels, and product engagement insights."
      />

      <GoogleAnalyticsSection isStandalone />
    </div>
  );
}

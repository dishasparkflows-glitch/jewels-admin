import React from 'react';
import { useAddJewelryProductContext } from './AddJewelryProductContext';
import SocialProofMetricsSection from '../../../components/common/SocialProofMetricsSection';

export default function Step6SeoPublish() {
  const { getStepPosition, seo, setSeo, basicDetails, setBasicDetails } = useAddJewelryProductContext();
  const seoStepNumber = getStepPosition(6);

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#eee8df] p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
        <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
          <div className="w-8 h-8 rounded-full bg-[#8b6f4e] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            {seoStepNumber}
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              SEO Configuration
            </h3>
            <p className="text-xs text-stone-500">
              Optimize search engine rankings, meta titles, and descriptions.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-900">Meta Title</label>
            <input
              type="text"
              value={seo.metaTitle}
              onChange={(e) => setSeo((prev) => ({ ...prev, metaTitle: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900">Keywords</label>
              <span className="text-[11px] text-stone-400 font-normal">Comma separated</span>
            </div>
            <input
              type="text"
              value={seo.keywords}
              onChange={(e) => setSeo((prev) => ({ ...prev, keywords: e.target.value }))}
              placeholder="e.g. diamond stud earrings, lab grown diamond, gold earrings"
              className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs placeholder:text-stone-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-900">Meta Description</label>
            <textarea
              rows={3}
              value={seo.metaDescription}
              onChange={(e) => setSeo((prev) => ({ ...prev, metaDescription: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs leading-relaxed placeholder:text-stone-400"
            />
          </div>
        </div>
      </div>

      <SocialProofMetricsSection
        stepBadge={seoStepNumber + 1}
        soldCount={basicDetails.soldCount}
        reviewCount={basicDetails.reviewCount}
        onSoldCountChange={(val) => setBasicDetails((prev) => ({ ...prev, soldCount: val }))}
        onReviewCountChange={(val) => setBasicDetails((prev) => ({ ...prev, reviewCount: val }))}
      />
    </div>
  );
}

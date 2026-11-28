import { HiOutlineSparkles } from 'react-icons/hi';
import SocialProofMetricsSection from '../../common/SocialProofMetricsSection';

export default function SeoConfigTab({
  seo,
  setSeo,
  soldCount,
  reviewCount,
  onSoldCountChange,
  onReviewCountChange,
  stepNumber,
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Box 1: SEO Configuration */}
      <div className="bg-white rounded-2xl border border-stone-400 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3.5 pb-4 border-b border-stone-200">
          {stepNumber ? (
            <div className="w-8 h-8 rounded-full bg-[#8b6f4e] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {stepNumber}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs border border-[#8b6f4e]/20 shrink-0">
              <HiOutlineSparkles className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className="text-base font-bold text-stone-900">
              SEO Configuration
            </h3>
            <p className="text-xs text-stone-500">
              Optimize organic discovery, keywords, and metadata tags for this jewellery item.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between h-5">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Meta Title
                </label>
                <span className="text-[10px] text-stone-400 font-mono">
                  {(seo?.metaTitle || '').length}/60
                </span>
              </div>
              <input
                type="text"
                value={seo?.metaTitle || ''}
                onChange={(e) => setSeo((prev) => ({ ...prev, metaTitle: e.target.value }))}
                placeholder="e.g. 92.5 Silver Handcrafted Bracelet | Fine Jewellery"
                className="w-full h-10 px-3.5 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs transition"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between h-5">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Keywords
                </label>
                <span className="text-[10px] text-stone-400">
                  Comma separated
                </span>
              </div>
              <input
                type="text"
                value={seo?.keywords || ''}
                onChange={(e) => setSeo((prev) => ({ ...prev, keywords: e.target.value }))}
                placeholder="silver bracelet, 925 silver, handmade jewellery"
                className="w-full h-10 px-3.5 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between h-5">
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                Meta Description
              </label>
              <span className="text-[10px] text-stone-400 font-mono">
                {(seo?.metaDescription || '').length}/160
              </span>
            </div>
            <textarea
              rows={3}
              value={seo?.metaDescription || ''}
              onChange={(e) => setSeo((prev) => ({ ...prev, metaDescription: e.target.value }))}
              placeholder="Brief summary for Google search results..."
              className="w-full p-3 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs transition"
            />
          </div>
        </div>
      </div>

      {/* Box 2: Social Proof & Urgency */}
      <SocialProofMetricsSection
        soldCount={soldCount}
        reviewCount={reviewCount}
        onSoldCountChange={onSoldCountChange}
        onReviewCountChange={onReviewCountChange}
      />
    </div>
  );
}

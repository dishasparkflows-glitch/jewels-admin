import { HiOutlineSparkles } from 'react-icons/hi';
import SocialProofMetricsSection from '../../common/SocialProofMetricsSection';

/* eslint-disable react/prop-types */

export default function SeoConfigTab({
  seo,
  setSeo,
  soldCount,
  reviewCount,
  onSoldCountChange,
  onReviewCountChange,
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-5 animate-fadeIn">
      <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
        <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
          <HiOutlineSparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-stone-900">
            SEO Configuration
          </h3>
          <p className="text-[11px] text-stone-400">
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
                {seo.metaTitle.length}/60
              </span>
            </div>
            <input
              type="text"
              value={seo.metaTitle}
              onChange={(e) => setSeo((prev) => ({ ...prev, metaTitle: e.target.value }))}
              placeholder="e.g. 92.5 Silver Handcrafted Bracelet | Neirah Fine Jewellery"
              className="w-full h-10 px-3.5 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
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
              value={seo.keywords}
              onChange={(e) => setSeo((prev) => ({ ...prev, keywords: e.target.value }))}
              placeholder="silver bracelet, 925 silver, handmade jewellery"
              className="w-full h-10 px-3.5 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between h-5">
            <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
              Meta Description
            </label>
            <span className="text-[10px] text-stone-400 font-mono">
              {seo.metaDescription.length}/160
            </span>
          </div>
          <textarea
            rows={3}
            value={seo.metaDescription}
            onChange={(e) => setSeo((prev) => ({ ...prev, metaDescription: e.target.value }))}
            placeholder="Brief summary for Google search results..."
            className="w-full p-3 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
          />
        </div>

        <SocialProofMetricsSection
          soldCount={soldCount}
          reviewCount={reviewCount}
          onSoldCountChange={onSoldCountChange}
          onReviewCountChange={onReviewCountChange}
        />
      </div>
    </div>
  );
}

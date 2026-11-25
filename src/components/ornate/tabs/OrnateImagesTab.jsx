import { HiOutlinePhotograph, HiOutlineEye, HiOutlineCheck } from 'react-icons/hi';


export default function OrnateImagesTab({
  ornateImages,
  handleOpenImagePreview,
  handleSetPrimaryImage,
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
            <HiOutlinePhotograph className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Ornate Images
            </h3>
            <p className="text-[11px] text-stone-400">
              Product gallery synchronized from ERP FTP & uploaded to Cloudflare R2 bucket.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
            {ornateImages.length} Image{ornateImages.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Images Grid (Display-Only Synchronized Gallery) */}
      {ornateImages.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-stone-200 bg-stone-50/60">
          <HiOutlinePhotograph className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-stone-600">No synchronized ERP gallery images found</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Images are automatically synchronized from the ERP FTP system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {ornateImages.map((img, idx) => (
            <div
              key={img.id}
              className="group relative rounded-xl overflow-hidden border border-stone-200/90 bg-stone-50 aspect-square shadow-2xs cursor-pointer"
              onClick={() => {
                const gallery = ornateImages.map((x) => x.url);
                handleOpenImagePreview(img.url, gallery);
              }}
            >
              <img
                src={img.url}
                alt={`Ornate product ${idx + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />

              {/* Primary Badge */}
              {img.isPrimary && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#8b6f4e] text-white shadow-xs">
                  Primary
                </span>
              )}

              {/* Hover Overlay Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const gallery = ornateImages.map((x) => x.url);
                    handleOpenImagePreview(img.url, gallery);
                  }}
                  title="Preview Image"
                  className="w-7 h-7 rounded-lg bg-white/90 text-stone-800 hover:bg-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                >
                  <HiOutlineEye className="w-3.5 h-3.5" />
                </button>
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimaryImage(img.id);
                    }}
                    title="Set as Primary"
                    className="w-7 h-7 rounded-lg bg-[#8b6f4e] text-white hover:bg-[#785e40] flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                  >
                    <HiOutlineCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

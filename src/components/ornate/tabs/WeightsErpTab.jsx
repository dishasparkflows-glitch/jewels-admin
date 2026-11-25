import { TbScale, TbDatabase } from 'react-icons/tb';

/* eslint-disable react/prop-types */

export default function WeightsErpTab({
  weights,
  setWeights,
  erpDetails,
  setErpDetails,
}) {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Sub-block A: Weights & Purities */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
          <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
            <TbScale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Weights & Purities
            </h3>
            <p className="text-[11px] text-stone-400">
              Gross and net metal mass with purity specifications.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
              Gross Weight (g)
            </label>
            <input
              type="number"
              step="0.01"
              value={weights.grossWeight}
              onChange={(e) =>
                setWeights((prev) => ({ ...prev, grossWeight: Number(e.target.value) || 0 }))
              }
              className="w-full h-10 px-3.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
              Net Weight (g)
            </label>
            <input
              type="number"
              step="0.01"
              value={weights.netWeight}
              onChange={(e) =>
                setWeights((prev) => ({ ...prev, netWeight: Number(e.target.value) || 0 }))
              }
              className="w-full h-10 px-3.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
              Purity (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={weights.purity}
              onChange={(e) =>
                setWeights((prev) => ({ ...prev, purity: Number(e.target.value) || 0 }))
              }
              className="w-full h-10 px-3.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
              Carat Category
            </label>
            <input
              type="text"
              value={weights.caratCategory}
              onChange={(e) =>
                setWeights((prev) => ({ ...prev, caratCategory: e.target.value }))
              }
              placeholder="e.g. 925SL or 18KT"
              className="w-full h-10 px-3.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>
        </div>
      </div>

      {/* Sub-block B: Classification & ERP Details */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
          <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
            <TbDatabase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Classification & ERP Details
            </h3>
            <p className="text-[11px] text-stone-400">
              Master identifiers and synchronized inventory attributes from Ornate NX ERP.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
              Custom Group Name
            </label>
            <input
              type="text"
              value={erpDetails.customGroupName}
              onChange={(e) =>
                setErpDetails((prev) => ({ ...prev, customGroupName: e.target.value }))
              }
              className="w-full h-9 px-3 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
              Item Name (ERP)
            </label>
            <input
              type="text"
              value={erpDetails.itemName}
              onChange={(e) =>
                setErpDetails((prev) => ({ ...prev, itemName: e.target.value }))
              }
              className="w-full h-9 px-3 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
              Group Name (ERP)
            </label>
            <input
              type="text"
              value={erpDetails.groupName}
              onChange={(e) =>
                setErpDetails((prev) => ({ ...prev, groupName: e.target.value }))
              }
              className="w-full h-9 px-3 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
              Variety Name (ERP)
            </label>
            <input
              type="text"
              value={erpDetails.varietyName}
              onChange={(e) =>
                setErpDetails((prev) => ({ ...prev, varietyName: e.target.value }))
              }
              className="w-full h-9 px-3 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
              Metal Name (ERP)
            </label>
            <input
              type="text"
              value={erpDetails.metalName}
              onChange={(e) =>
                setErpDetails((prev) => ({ ...prev, metalName: e.target.value }))
              }
              className="w-full h-9 px-3 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
              Unique ERP Label ID
            </label>
            <input
              type="text"
              value={erpDetails.uniqueLabelId}
              onChange={(e) =>
                setErpDetails((prev) => ({ ...prev, uniqueLabelId: e.target.value }))
              }
              className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
              Barcode Number
            </label>
            <input
              type="text"
              value={erpDetails.barcodeNumber}
              onChange={(e) =>
                setErpDetails((prev) => ({ ...prev, barcodeNumber: e.target.value }))
              }
              className="w-full h-9 px-3 text-xs font-mono font-bold rounded-xl border border-stone-200 bg-white text-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
              Label Number (ERP)
            </label>
            <input
              type="text"
              value={erpDetails.labelNumber}
              onChange={(e) =>
                setErpDetails((prev) => ({ ...prev, labelNumber: e.target.value }))
              }
              className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
              Company Code
            </label>
            <input
              type="text"
              value={erpDetails.companyCode}
              onChange={(e) =>
                setErpDetails((prev) => ({ ...prev, companyCode: e.target.value }))
              }
              className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="space-y-1 sm:col-span-2 lg:col-span-4">
            <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
              ERP Remark / Notes
            </label>
            <input
              type="text"
              value={erpDetails.remark}
              onChange={(e) =>
                setErpDetails((prev) => ({ ...prev, remark: e.target.value }))
              }
              placeholder="Enter remark or ERP notes..."
              className="w-full h-9 px-3 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

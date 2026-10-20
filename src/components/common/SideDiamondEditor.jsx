import { useState, useEffect, useMemo } from 'react';
import { HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import api from '../../api/axios';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function SideDiamondEditor({ rows, onChange, masters }) {
  const [apiSideRates, setApiSideRates] = useState([]);

  // Fetch live side diamond pricing master
  useEffect(() => {
    let active = true;
    const fetchRates = async () => {
      try {
        const res = await api.get('/side-diamond-prices?limit=500');
        const items = res.data?.data?.items || res.data?.data || [];
        if (active && Array.isArray(items)) {
          setApiSideRates(items);
        }
      } catch (err) {
        console.warn('Side diamond rates lookup notice:', err);
      }
    };
    fetchRates();
    return () => { active = false; };
  }, []);

  const types = masters?.types || [];
  const shapes = masters?.shapes || [];
  const colors = masters?.colors || [];
  const clarities = masters?.clarities || [];

  // Currently selected diamond type (default to Lab Grown or first available type)
  const defaultTypeId = useMemo(() => {
    const labGrown = types.find((t) => t.name?.toLowerCase().includes('lab'));
    return labGrown?._id || types[0]?._id || '';
  }, [types]);

  const activeDiamondTypeId = rows[0]?.diamondTypeId || defaultTypeId;
  const activeDiamondTypeName = types.find((t) => (t._id || t.id) === activeDiamondTypeId)?.name || 'Lab Grown Diamond';

  // Helper to look up rate from master
  const lookupMasterRate = (typeId, shapeId, colorId, clarityId, pieces, caratWeight) => {
    const pcs = Number(pieces) || 1;
    const ct = Number(caratWeight) || 0;
    if (!ct || !pcs || apiSideRates.length === 0) return 0;
    const avgSize = ct / pcs;

    const matched = apiSideRates.find((r) => {
      const t = String(r.diamondTypeId?._id || r.diamondTypeId || '');
      const s = String(r.diamondShapeId?._id || r.diamondShapeId || '');
      const c = String(r.diamondColorId?._id || r.diamondColorId || '');
      const cl = String(r.diamondClarityId?._id || r.diamondClarityId || '');
      const from = Number(r.sizeFrom ?? 0);
      const to = Number(r.sizeTo ?? 999);

      return (
        (!typeId || t === String(typeId)) &&
        (!shapeId || s === String(shapeId)) &&
        (!colorId || c === String(colorId)) &&
        (!clarityId || cl === String(clarityId)) &&
        avgSize >= from &&
        avgSize <= to
      );
    });

    return matched ? Number(matched.priceINR) || 0 : 0;
  };

  const handleTypeSelect = (typeId) => {
    onChange(
      rows.map((row) => {
        const newRate = lookupMasterRate(
          typeId,
          row.diamondShapeId,
          row.diamondColorId,
          row.diamondClarityId,
          row.pieces,
          row.caratWeight
        );
        return {
          ...row,
          diamondTypeId: typeId,
          priceINR: row.rateSource === 'manual' ? row.priceINR : (newRate || row.priceINR),
        };
      })
    );
  };

  const handleAddRow = () => {
    const defaultShape = shapes.find((s) => s.name?.toLowerCase().includes('round'))?._id || shapes[0]?._id || '';
    const defaultColor = colors[0]?._id || '';
    const defaultClarity = clarities[0]?._id || '';
    const initialPieces = 16;
    const initialCarat = 0.24;
    const autoRate = lookupMasterRate(activeDiamondTypeId, defaultShape, defaultColor, defaultClarity, initialPieces, initialCarat);

    const newRow = {
      diamondTypeId: activeDiamondTypeId,
      diamondShapeId: defaultShape,
      diamondColorId: defaultColor,
      diamondClarityId: defaultClarity,
      pieces: initialPieces,
      caratWeight: initialCarat,
      priceINR: autoRate || 20000,
      rateSource: autoRate ? 'master' : 'manual',
    };

    onChange([...rows, newRow]);
  };

  const updateRow = (index, key, val) => {
    const updated = rows.map((row, i) => {
      if (i !== index) return row;
      const next = { ...row, [key]: val };

      // If user altered dimensions/weights, attempt master rate re-lookup unless manually edited
      if (['diamondShapeId', 'diamondColorId', 'diamondClarityId', 'pieces', 'caratWeight'].includes(key)) {
        if (next.rateSource !== 'manual') {
          const autoRate = lookupMasterRate(
            next.diamondTypeId || activeDiamondTypeId,
            next.diamondShapeId,
            next.diamondColorId,
            next.diamondClarityId,
            next.pieces,
            next.caratWeight
          );
          if (autoRate > 0) {
            next.priceINR = autoRate;
          }
        }
      }

      if (key === 'priceINR') {
        next.rateSource = 'manual';
      }

      return next;
    });
    onChange(updated);
  };

  const removeRow = (index) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  // Totals for summary footer
  const totalPieces = rows.reduce((sum, r) => sum + (Number(r.pieces) || 0), 0);
  const totalCarats = rows.reduce((sum, r) => sum + (Number(r.caratWeight) || 0), 0);
  const totalPrice = rows.reduce((sum, r) => sum + ((Number(r.caratWeight) || 0) * (Number(r.priceINR) || 0)), 0);

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 space-y-5 shadow-2xs">
      {/* ─── Top Header: SIDE DIAMOND CONFIGURATION ─── */}
      <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
        <IoDiamondOutline className="w-4 h-4 text-[#8b6f4e]" />
        <h3 className="text-xs font-bold tracking-wider uppercase text-stone-800">
          Side Diamond Configuration
        </h3>
      </div>

      {/* ─── Diamond Type Selector ─── */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Diamond Type
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {types.map((type) => {
            const isSelected = String(type._id || type.id) === String(activeDiamondTypeId);
            return (
              <button
                key={type._id || type.id}
                type="button"
                onClick={() => handleTypeSelect(type._id || type.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#8b6f4e] text-white shadow-xs'
                    : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {type.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Sub-Section: Side Diamonds Table ─── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            {activeDiamondTypeName.toUpperCase()} SIDE DIAMONDS
          </h4>
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Row</span>
          </button>
        </div>

        {/* ─── Table ─── */}
        <div className="border border-stone-200/90 rounded-xl overflow-hidden shadow-2xs bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#faf9f7] border-b border-stone-200/80 text-[9.5px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 min-w-[130px]">SHAPE</th>
                  <th className="py-2.5 px-3 min-w-[110px]">COLOR</th>
                  <th className="py-2.5 px-3 min-w-[110px]">CLARITY</th>
                  <th className="py-2.5 px-3 w-20 text-center">PIECES</th>
                  <th className="py-2.5 px-3 w-28 text-center">CARAT (CT)</th>
                  <th className="py-2.5 px-3 w-32 text-right">RATE/CT (₹)</th>
                  <th className="py-2.5 px-3 w-32 text-right">TOTAL PRICE (₹)</th>
                  <th className="py-2.5 px-3 w-16 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-[11px]">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-stone-400">
                      <p className="text-xs font-semibold text-stone-600">No side diamonds configured</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Click &ldquo;+ Add Row&rdquo; to add side diamond accent or quality tier options.</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const rowPrice = (Number(row.caratWeight) || 0) * (Number(row.priceINR) || 0);
                    return (
                      <tr key={row._id || index} className="hover:bg-stone-50/70 transition-colors">
                        {/* Shape */}
                        <td className="py-2 px-3">
                          <select
                            value={row.diamondShapeId || ''}
                            onChange={(e) => updateRow(index, 'diamondShapeId', e.target.value)}
                            className="w-full h-8 px-2 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#8b6f4e] cursor-pointer"
                          >
                            {shapes.map((s) => (
                              <option key={s._id || s.id} value={s._id || s.id}>
                                {s.name.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Color */}
                        <td className="py-2 px-3">
                          <select
                            value={row.diamondColorId || ''}
                            onChange={(e) => updateRow(index, 'diamondColorId', e.target.value)}
                            className="w-full h-8 px-2 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#8b6f4e] cursor-pointer"
                          >
                            {colors.map((c) => (
                              <option key={c._id || c.id} value={c._id || c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Clarity */}
                        <td className="py-2 px-3">
                          <select
                            value={row.diamondClarityId || ''}
                            onChange={(e) => updateRow(index, 'diamondClarityId', e.target.value)}
                            className="w-full h-8 px-2 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#8b6f4e] cursor-pointer"
                          >
                            {clarities.map((cl) => (
                              <option key={cl._id || cl.id} value={cl._id || cl.id}>
                                {cl.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Pieces */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={row.pieces ?? ''}
                            onChange={(e) => updateRow(index, 'pieces', e.target.value)}
                            className="w-full h-8 px-2 text-center text-xs font-medium text-stone-800 rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                          />
                        </td>

                        {/* Carat (CT) */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={row.caratWeight ?? ''}
                            onChange={(e) => updateRow(index, 'caratWeight', e.target.value)}
                            className="w-full h-8 px-2 text-center text-xs font-medium text-stone-800 rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                          />
                        </td>

                        {/* Rate/ct */}
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={row.priceINR ?? ''}
                            onChange={(e) => updateRow(index, 'priceINR', e.target.value)}
                            className="w-full h-8 px-2 text-right font-mono text-xs font-semibold text-stone-800 rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                          />
                        </td>

                        {/* Total Price */}
                        <td className="py-2 px-3 text-right font-mono text-xs font-bold text-stone-900">
                          {formatINR(rowPrice)}
                        </td>

                        {/* Delete Action */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete row"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* ─── Footer: TOTAL SIDE DIAMONDS ─── */}
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-[#faf9f7] border-t-2 border-stone-200 font-bold text-xs text-stone-800">
                    <td className="py-3 px-3 uppercase tracking-wider text-[10px] text-stone-500" colSpan={3}>
                      TOTAL SIDE DIAMONDS
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {totalPieces} Pcs
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {totalCarats.toFixed(3)} ct
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-stone-400">
                      —
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#8b6f4e] font-extrabold text-sm">
                      {formatINR(totalPrice)}
                    </td>
                    <td className="py-3 px-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

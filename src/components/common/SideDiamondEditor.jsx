import { useEffect, useState, useRef } from 'react';
import Dropdown from './Dropdown';
import api from '../../api/axios';

const id = (v) => String(v?._id || v || '');
const physical = ['diamondShapeId', 'pieces', 'caratWeight', 'sizeFrom', 'sizeTo'];
const money = (v) => Number(v).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
const isEmpty = (v) => v === '' || v === null || v === undefined;

export default function SideDiamondEditor({ rows, onChange, masters }) {
  const [rates, setRates] = useState([]);
  const [error, setError] = useState(false);
  const types = masters?.types || [];

  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const resolveEntityId = (val, listKey) => {
    if (!val) return '';
    const raw = id(val);
    if (/^[a-f\d]{24}$/i.test(raw)) return raw;
    const match = (masters?.[listKey] || []).find(
      (item) => item.name?.toLowerCase() === raw.toLowerCase() || id(item) === raw
    );
    return match ? id(match) : raw;
  };

  const enabled = [...new Set(rows.map((r) => resolveEntityId(r.diamondTypeId, 'types')))].filter(Boolean);
  const enabledKey = enabled.slice().sort().join(',');

  const selectedShapes = [...new Set(rows.map((r) => resolveEntityId(r.diamondShapeId, 'shapes')))].filter(Boolean);
  const shapesKey = selectedShapes.slice().sort().join(',');

  const autoFillRow = (r, ratesList = rates) => {
    if (!r.diamondShapeId || !ratesList || ratesList.length === 0) return r;

    const rTypeId = resolveEntityId(r.diamondTypeId, 'types');
    const rShapeId = resolveEntityId(r.diamondShapeId, 'shapes');
    const rColorId = resolveEntityId(r.diamondColorId, 'colors');
    const rClarityId = resolveEntityId(r.diamondClarityId, 'clarities');

    // 1. Try to find match with current type, shape, color, clarity
    let matched = ratesList.find((m) => {
      const typeMatch = id(m.diamondTypeId) === rTypeId || String(m.diamondTypeId?.name || '').toLowerCase() === String(r.diamondTypeId).toLowerCase();
      const shapeMatch = id(m.diamondShapeId) === rShapeId || String(m.diamondShapeId?.name || '').toLowerCase() === String(r.diamondShapeId).toLowerCase();
      const colorMatch = !rColorId || id(m.diamondColorId) === rColorId || String(m.diamondColorId?.name || '').toLowerCase() === String(r.diamondColorId).toLowerCase();
      const clarityMatch = !rClarityId || id(m.diamondClarityId) === rClarityId || String(m.diamondClarityId?.name || '').toLowerCase() === String(r.diamondClarityId).toLowerCase();
      return typeMatch && shapeMatch && colorMatch && clarityMatch;
    });

    // 2. Fallback: match by at least type & shape if color or clarity were empty
    if (!matched) {
      matched = ratesList.find((m) => {
        const typeMatch = id(m.diamondTypeId) === rTypeId || String(m.diamondTypeId?.name || '').toLowerCase() === String(r.diamondTypeId).toLowerCase();
        const shapeMatch = id(m.diamondShapeId) === rShapeId || String(m.diamondShapeId?.name || '').toLowerCase() === String(r.diamondShapeId).toLowerCase();
        return typeMatch && shapeMatch;
      });
    }

    if (!matched) return r;

    let updated = { ...r };
    let changed = false;

    if (isEmpty(updated.diamondColorId) && matched.diamondColorId) {
      updated.diamondColorId = id(matched.diamondColorId);
      changed = true;
    }
    if (isEmpty(updated.diamondClarityId) && matched.diamondClarityId) {
      updated.diamondClarityId = id(matched.diamondClarityId);
      changed = true;
    }
    if (isEmpty(updated.sizeFrom) || isEmpty(updated.sizeTo)) {
      if (!isEmpty(matched.sizeFrom)) {
        updated.sizeFrom = matched.sizeFrom;
        changed = true;
      }
      if (!isEmpty(matched.sizeTo)) {
        updated.sizeTo = matched.sizeTo;
        changed = true;
      }
    }

    return changed ? updated : r;
  };

  const getAvailableSizeRanges = (r) => {
    if (!rates || rates.length === 0) return [];
    const rTypeId = resolveEntityId(r.diamondTypeId, 'types');
    const rShapeId = resolveEntityId(r.diamondShapeId, 'shapes');
    const rColorId = resolveEntityId(r.diamondColorId, 'colors');
    const rClarityId = resolveEntityId(r.diamondClarityId, 'clarities');

    const matching = rates.filter((m) => {
      const typeMatch = id(m.diamondTypeId) === rTypeId || String(m.diamondTypeId?.name || '').toLowerCase() === String(r.diamondTypeId).toLowerCase();
      const shapeMatch = id(m.diamondShapeId) === rShapeId || String(m.diamondShapeId?.name || '').toLowerCase() === String(r.diamondShapeId).toLowerCase();
      const colorMatch = !rColorId || id(m.diamondColorId) === rColorId || String(m.diamondColorId?.name || '').toLowerCase() === String(r.diamondColorId).toLowerCase();
      const clarityMatch = !rClarityId || id(m.diamondClarityId) === rClarityId || String(m.diamondClarityId?.name || '').toLowerCase() === String(r.diamondClarityId).toLowerCase();
      return typeMatch && shapeMatch && colorMatch && clarityMatch;
    });

    const seen = new Set();
    const ranges = [];
    matching.forEach((m) => {
      const from = Number(m.sizeFrom ?? 0);
      const to = Number(m.sizeTo ?? 0);
      const key = `${from}:${to}`;
      if (!seen.has(key)) {
        seen.add(key);
        ranges.push({
          from,
          to,
          rate: Number(m.priceINR || 0),
          label: `${from} - ${to} mm (${money(m.priceINR)}/ct)`,
        });
      }
    });
    return ranges;
  };

  useEffect(() => {
    if (!enabledKey || !shapesKey) {
      setRates([]);
      return;
    }
    let active = true;
    api
      .get(`/side-diamond-prices/lookup?diamondTypeId=${encodeURIComponent(enabledKey)}&diamondShapeId=${encodeURIComponent(shapesKey)}`)
      .then(({ data }) => {
        if (!active) return;
        const items = data?.data?.items || data?.data || [];
        setRates(items);

        if (Array.isArray(items) && items.length > 0) {
          const currentRows = rowsRef.current || [];
          let anyChanged = false;
          const filled = currentRows.map((r) => {
            const nextR = autoFillRow(r, items);
            if (nextR !== r) anyChanged = true;
            return nextR;
          });
          if (anyChanged) {
            onChange(filled);
          }
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [enabledKey, shapesKey]);

  const blank = (type) => ({
    diamondTypeId: type,
    diamondShapeId: '',
    diamondColorId: '',
    diamondClarityId: '',
    pieces: '',
    caratWeight: '',
    sizeFrom: '',
    sizeTo: '',
    priceINR: 0,
    rateSource: 'master',
  });

  const toggle = (type) => {
    if (enabled.includes(type)) {
      return onChange(rows.filter((r) => resolveEntityId(r.diamondTypeId, 'types') !== type && id(r.diamondTypeId) !== type));
    }
    const source = rows.filter((r) => resolveEntityId(r.diamondTypeId, 'types') === enabled[0] || id(r.diamondTypeId) === enabled[0]);
    onChange([
      ...rows,
      ...(source.length
        ? source.map(({ _id, ...r }) => ({ ...r, diamondTypeId: type, priceINR: 0, rateSource: 'master' }))
        : [blank(type)]),
    ]);
  };

  const addRow = () => {
    const copies = enabled.map((type) => {
      const previous = rows.filter((row) => (resolveEntityId(row.diamondTypeId, 'types') || id(row.diamondTypeId)) === type).at(-1);
      let next = blank(type);
      if (previous) {
        [...physical, 'diamondColorId', 'diamondClarityId'].forEach((field) => {
          next[field] = previous[field] ?? '';
        });
      } else {
        next = autoFillRow(next, rates);
      }
      return { ...next, priceINR: '', rateSource: 'manual' };
    });
    onChange([...rows, ...copies]);
  };

  const positionOf = (index) => {
    const curType = resolveEntityId(rows[index].diamondTypeId, 'types') || id(rows[index].diamondTypeId);
    return rows.slice(0, index).filter((r) => (resolveEntityId(r.diamondTypeId, 'types') || id(r.diamondTypeId)) === curType).length;
  };

  const update = (index, key, value) => {
    const position = positionOf(index);
    const offsets = {};
    const curType = resolveEntityId(rows[index].diamondTypeId, 'types') || id(rows[index].diamondTypeId);
    const updated = rows.map((r, i) => {
      const type = resolveEntityId(r.diamondTypeId, 'types') || id(r.diamondTypeId);
      const ordinal = offsets[type] || 0;
      offsets[type] = ordinal + 1;
      if (i !== index && !(physical.includes(key) && type !== curType && ordinal === position)) return r;

      let nextR = {
        ...r,
        [key]: value,
        ...(key === 'priceINR' ? { rateSource: value === '' || Number(value) > 0 ? 'manual' : 'master' } : {}),
      };

      if (['diamondShapeId', 'diamondColorId', 'diamondClarityId'].includes(key) && rates.length > 0) {
        nextR = autoFillRow(nextR, rates);
      }

      return nextR;
    });

    onChange(updated);
  };

  const updateMultiple = (index, fields) => {
    const position = positionOf(index);
    const offsets = {};
    const curType = resolveEntityId(rows[index].diamondTypeId, 'types') || id(rows[index].diamondTypeId);
    onChange(
      rows.map((r, i) => {
        const type = resolveEntityId(r.diamondTypeId, 'types') || id(r.diamondTypeId);
        const ordinal = offsets[type] || 0;
        offsets[type] = ordinal + 1;
        const isTarget = i === index;
        const isSynced = type !== curType && ordinal === position;
        if (!isTarget && !isSynced) return r;
        return {
          ...r,
          ...fields,
        };
      })
    );
  };

  const remove = (index) => {
    const position = positionOf(index);
    const offsets = {};
    onChange(
      rows.filter((r) => {
        const type = resolveEntityId(r.diamondTypeId, 'types') || id(r.diamondTypeId);
        const ordinal = offsets[type] || 0;
        offsets[type] = ordinal + 1;
        return ordinal !== position;
      })
    );
  };

  const rateFor = (r) => {
    if (r.rateSource === 'manual' && r.priceINR === '') return 0;
    if (r.rateSource !== 'master' && Number(r.priceINR) > 0) return Number(r.priceINR);
    const rTypeId = resolveEntityId(r.diamondTypeId, 'types');
    const rShapeId = resolveEntityId(r.diamondShapeId, 'shapes');
    const rColorId = resolveEntityId(r.diamondColorId, 'colors');
    const rClarityId = resolveEntityId(r.diamondClarityId, 'clarities');

    const matches = rates.filter((m) => {
      const mTypeId = id(m.diamondTypeId);
      const mShapeId = id(m.diamondShapeId);
      const mColorId = id(m.diamondColorId);
      const mClarityId = id(m.diamondClarityId);

      const typeMatch = mTypeId === rTypeId || String(m.diamondTypeId?.name || '').toLowerCase() === String(r.diamondTypeId).toLowerCase();
      const shapeMatch = mShapeId === rShapeId || String(m.diamondShapeId?.name || '').toLowerCase() === String(r.diamondShapeId).toLowerCase();
      const colorMatch = mColorId === rColorId || String(m.diamondColorId?.name || '').toLowerCase() === String(r.diamondColorId).toLowerCase();
      const clarityMatch = mClarityId === rClarityId || String(m.diamondClarityId?.name || '').toLowerCase() === String(r.diamondClarityId).toLowerCase();

      return (
        typeMatch &&
        shapeMatch &&
        colorMatch &&
        clarityMatch &&
        Number(m.sizeFrom) === Number(r.sizeFrom) &&
        Number(m.sizeTo) === Number(r.sizeTo)
      );
    });
    return matches.length === 1 ? Number(matches[0].priceINR) : null;
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-5">
      <h3 className="text-xs font-bold uppercase tracking-wider">Side Diamond Configuration</h3>
      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            type="button"
            key={id(t)}
            aria-pressed={enabled.includes(id(t))}
            onClick={() => toggle(id(t))}
            className={`rounded-lg px-3 py-2 text-xs border ${
              enabled.includes(id(t)) ? 'bg-[#8b6f4e] text-white' : 'bg-white text-stone-700'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
      <p className="text-xs text-stone-500">
        Select one or more types. Physical specifications sync across corresponding rows; rates stay independent. Enter 0 for a live master rate. Side-only rows are alternative quality options.
      </p>
      {error && (
        <p className="text-xs text-amber-700">
          Master preview unavailable. Compute Variants will validate rates on the server.
        </p>
      )}
      {enabled.map((type) => (
        <div key={type} className="space-y-3">
          <div className="flex justify-between">
            <h4 className="text-xs font-bold uppercase">
              {types.find((t) => id(t) === type)?.name || 'Diamond type'}
            </h4>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#8b6f4e] bg-[#8b6f4e] px-3 py-2 text-xs font-semibold text-white hover:bg-[#785e40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6f4e] focus-visible:ring-offset-2"
              onClick={addRow}
            >
              + Add Row
            </button>
          </div>
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50">
                <tr>
                  {[
                    'Shape',
                    'Color',
                    'Clarity',
                    'Sieve from (mm)',
                    'Sieve to (mm)',
                    'Pieces',
                    'Carat (ct)',
                    'Rate/Ct',
                    'Total price',
                    '',
                  ].map((label, i) => (
                    <th key={i} className="p-2">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, index) => {
                  if (resolveEntityId(r.diamondTypeId, 'types') !== type && id(r.diamondTypeId) !== type) return null;
                  const rate = rateFor(r);
                  const ranges = getAvailableSizeRanges(r);
                  return (
                    <tr key={r._id || index} className="border-t">
                      {[
                        ['diamondShapeId', 'shapes'],
                        ['diamondColorId', 'colors'],
                        ['diamondClarityId', 'clarities'],
                      ].map(([field, list]) => (
                        <td key={field} className="p-2 min-w-32">
                          <Dropdown
                            size="sm"
                            openDownward
                            portal
                            animate={false}
                            value={id(r[field])}
                            options={(masters?.[list] || []).map((item) => ({
                              value: id(item),
                              label: item.name,
                            }))}
                            onChange={(value) => update(index, field, value)}
                          />
                        </td>
                      ))}
                      {/* Sieve from (mm) */}
                      <td className="p-2">
                        <input
                          aria-label="sizeFrom"
                          placeholder="0"
                          type="number"
                          min="0"
                          step="any"
                          value={r.sizeFrom ?? ''}
                          onChange={(e) => update(index, 'sizeFrom', e.target.value)}
                          className="w-24 rounded border border-stone-200 p-2 text-xs font-mono"
                        />
                        {ranges.length > 0 && (
                          <select
                            aria-label="Preset Sieve Range"
                            className="mt-1 block w-24 text-[10px] text-stone-600 bg-stone-50 border border-stone-200 rounded px-1 py-0.5 truncate cursor-pointer hover:border-stone-400"
                            value={
                              ranges.some((rg) => rg.from === Number(r.sizeFrom) && rg.to === Number(r.sizeTo))
                                ? `${Number(r.sizeFrom)}:${Number(r.sizeTo)}`
                                : ''
                            }
                            onChange={(e) => {
                              const [f, t] = e.target.value.split(':');
                              if (f !== undefined && t !== undefined) {
                                updateMultiple(index, { sizeFrom: Number(f), sizeTo: Number(t) });
                              }
                            }}
                            title="Select from master sieve size ranges"
                          >
                            <option value="" disabled>Preset...</option>
                            {ranges.map((rg) => (
                              <option key={`${rg.from}:${rg.to}`} value={`${rg.from}:${rg.to}`}>
                                {rg.from} - {rg.to} mm
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      {/* Sieve to (mm) */}
                      <td className="p-2">
                        <input
                          aria-label="sizeTo"
                          placeholder="0.01"
                          type="number"
                          min="0"
                          step="any"
                          value={r.sizeTo ?? ''}
                          onChange={(e) => update(index, 'sizeTo', e.target.value)}
                          className="w-24 rounded border border-stone-200 p-2 text-xs font-mono"
                        />
                      </td>
                      {/* Pieces */}
                      <td className="p-2">
                        <input
                          aria-label="pieces"
                          placeholder="Pieces"
                          type="number"
                          min="0"
                          step="1"
                          value={r.pieces ?? ''}
                          onChange={(e) => update(index, 'pieces', e.target.value)}
                          className="w-24 rounded border border-stone-200 p-2 text-xs"
                        />
                      </td>
                      {/* Carat (ct) */}
                      <td className="p-2">
                        <input
                          aria-label="caratWeight"
                          placeholder="Carat"
                          type="number"
                          min="0"
                          step="any"
                          value={r.caratWeight ?? ''}
                          onChange={(e) => update(index, 'caratWeight', e.target.value)}
                          className="w-24 rounded border border-stone-200 p-2 text-xs"
                        />
                      </td>
                      {/* Rate/Ct */}
                      <td className="p-2">
                        <input
                          aria-label="priceINR"
                          placeholder={rate !== null ? String(rate) : 'Rate/Ct'}
                          type="number"
                          min="0"
                          step="any"
                          value={r.rateSource === 'master' ? (r.priceINR === '' || Number(r.priceINR) === 0 ? 0 : r.priceINR) : (r.priceINR ?? '')}
                          onChange={(e) => update(index, 'priceINR', e.target.value)}
                          className="w-24 rounded border border-stone-200 p-2 text-xs"
                        />
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {rate === null ? (
                          <span className="text-amber-600 font-medium">Master rate missing</span>
                        ) : (
                          <>
                            <span className="font-semibold text-stone-900">
                              {money(rate * Number(r.caratWeight || 0))}
                            </span>
                            <small className="block text-stone-500 font-medium">{money(rate)} / ct</small>
                          </>
                        )}
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          aria-label="Delete corresponding quality rows"
                          onClick={() => remove(index)}
                          className="text-stone-400 hover:text-rose-600 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}

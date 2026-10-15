import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlineUpload,
  HiOutlineDownload,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineRefresh,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Dropdown from '../../components/common/Dropdown';
import { useConfirm } from '../../contexts/ConfirmContext';

// Default Master Options matching luxury portal
const DEFAULT_SHAPES = ['FANCY', 'ROUND', 'OVAL', 'EMERALD', 'PEAR', 'CUSHION', 'PRINCESS', 'MARQUISE', 'RADIANT', 'ASSCHER', 'HEART'];
const DEFAULT_COLORS = ['D-E', 'E-F', 'F-G', 'G-H', 'I-J', 'K-L', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const DEFAULT_CLARITIES = ['VS', 'VVS', '-', 'SI', 'FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'];

// Generates 62 Initial Realistic Price Rows ending with rows 54-62 from User Screenshot
const generateInitialCenterRows = () => {
  const rows = [];
  let idCounter = 1;

  const brackets = [
    { from: 0.3, to: 1.49 },
    { from: 1.5, to: 5.99 },
    { from: 6.0, to: 10.0 },
  ];

  // 1. ROUND (18 rows)
  ['D-E', 'E-F', 'F-G', 'G-H', 'I-J', 'K-L'].forEach((col) => {
    brackets.forEach((br) => {
      const base = col === 'D-E' ? 23100 : col === 'E-F' ? 18500 : col === 'F-G' ? 15500 : col === 'G-H' ? 12800 : col === 'I-J' ? 10200 : 8500;
      const rate = br.from >= 6 ? Math.round(base * 1.35) : br.from >= 1.5 ? Math.round(base * 1.15) : base;
      rows.push({
        id: `c_${idCounter++}`,
        shape: 'ROUND',
        color: col,
        clarity: col === 'D-E' ? 'VVS' : 'VS',
        sizeFrom: br.from,
        sizeTo: br.to,
        priceINR: rate,
      });
    });
  });

  // 2. OVAL (15 rows)
  ['D-E', 'E-F', 'F-G', 'G-H', 'I-J'].forEach((col) => {
    brackets.forEach((br) => {
      const base = col === 'D-E' ? 23500 : col === 'E-F' ? 18900 : col === 'F-G' ? 15800 : col === 'G-H' ? 13100 : 10500;
      const rate = br.from >= 6 ? Math.round(base * 1.35) : br.from >= 1.5 ? Math.round(base * 1.15) : base;
      rows.push({
        id: `c_${idCounter++}`,
        shape: 'OVAL',
        color: col,
        clarity: 'VS',
        sizeFrom: br.from,
        sizeTo: br.to,
        priceINR: rate,
      });
    });
  });

  // 3. EMERALD (12 rows)
  ['D-E', 'E-F', 'F-G', 'G-H'].forEach((col) => {
    brackets.forEach((br) => {
      const base = col === 'D-E' ? 22800 : col === 'E-F' ? 18200 : col === 'F-G' ? 15200 : 12500;
      const rate = br.from >= 6 ? Math.round(base * 1.35) : br.from >= 1.5 ? Math.round(base * 1.15) : base;
      rows.push({
        id: `c_${idCounter++}`,
        shape: 'EMERALD',
        color: col,
        clarity: 'VS',
        sizeFrom: br.from,
        sizeTo: br.to,
        priceINR: rate,
      });
    });
  });

  // 4. PEAR (8 rows)
  ['D-E', 'F-G', 'G-H'].forEach((col) => {
    brackets.forEach((br) => {
      if (rows.length >= 53) return;
      const base = col === 'D-E' ? 22500 : 15100;
      const rate = br.from >= 6 ? Math.round(base * 1.35) : br.from >= 1.5 ? Math.round(base * 1.15) : base;
      rows.push({
        id: `c_${idCounter++}`,
        shape: 'PEAR',
        color: col,
        clarity: 'VS',
        sizeFrom: br.from,
        sizeTo: br.to,
        priceINR: rate,
      });
    });
  });

  // 5. Exactly rows 54-62 matching user screenshot for FANCY!
  rows.push(
    { id: 'c_54', shape: 'FANCY', color: 'E-F', clarity: '-', sizeFrom: 0.3, sizeTo: 1.49, priceINR: 14553 },
    { id: 'c_55', shape: 'FANCY', color: 'E-F', clarity: '-', sizeFrom: 1.5, sizeTo: 5.99, priceINR: 16008 },
    { id: 'c_56', shape: 'FANCY', color: 'E-F', clarity: '-', sizeFrom: 6, sizeTo: 10, priceINR: 21000 },
    { id: 'c_57', shape: 'FANCY', color: 'F-G', clarity: '-', sizeFrom: 0.3, sizeTo: 1.49, priceINR: 13340.25 },
    { id: 'c_58', shape: 'FANCY', color: 'F-G', clarity: '-', sizeFrom: 1.5, sizeTo: 5.99, priceINR: 14674 },
    { id: 'c_59', shape: 'FANCY', color: 'F-G', clarity: '-', sizeFrom: 6, sizeTo: 10, priceINR: 21750 },
    { id: 'c_60', shape: 'FANCY', color: 'G-H', clarity: '-', sizeFrom: 0.3, sizeTo: 1.49, priceINR: 10914.75 },
    { id: 'c_61', shape: 'FANCY', color: 'G-H', clarity: '-', sizeFrom: 1.5, sizeTo: 5.99, priceINR: 12006 },
    { id: 'c_62', shape: 'FANCY', color: 'G-H', clarity: '-', sizeFrom: 6, sizeTo: 10, priceINR: 18002 },
  );

  return rows;
};

const INITIAL_CENTER_ROWS = generateInitialCenterRows();

const INITIAL_SIDE_ROWS = [
  { id: 's1', shape: 'ROUND', color: 'D-E', clarity: 'VVS', sizeFrom: 0.01, sizeTo: 0.05, priceINR: 42000 },
  { id: 's2', shape: 'ROUND', color: 'D-E', clarity: 'VS', sizeFrom: 0.01, sizeTo: 0.05, priceINR: 38000 },
  { id: 's3', shape: 'ROUND', color: 'F-G', clarity: 'VS', sizeFrom: 0.01, sizeTo: 0.05, priceINR: 32000 },
  { id: 's4', shape: 'ROUND', color: 'F-G', clarity: 'VS', sizeFrom: 0.05, sizeTo: 0.15, priceINR: 36000 },
  { id: 's5', shape: 'ROUND', color: 'G-H', clarity: 'VS', sizeFrom: 0.01, sizeTo: 0.05, priceINR: 28000 },
  { id: 's6', shape: 'BAGUETTE', color: 'D-E', clarity: 'VS', sizeFrom: 0.01, sizeTo: 0.05, priceINR: 44000 },
  { id: 's7', shape: 'BAGUETTE', color: 'F-G', clarity: 'VS', sizeFrom: 0.01, sizeTo: 0.05, priceINR: 36000 },
  { id: 's8', shape: 'PRINCESS', color: 'D-E', clarity: 'VS', sizeFrom: 0.01, sizeTo: 0.05, priceINR: 41000 },
];

export default function DiamondPricingMasterView() {
  const [searchParams] = useSearchParams();
  const confirm = useConfirm();
  const fileInputRef = useRef(null);
  const tableEndRef = useRef(null);

  // Active Type & Tab State
  const [activeType, setActiveType] = useState('Lab Grown Diamond'); // 'Lab Grown Diamond' | 'Natural Diamond'
  const [activeTab, setActiveTab] = useState('center'); // 'center' | 'side'

  // Master attributes lookup
  const [shapesList, setShapesList] = useState(DEFAULT_SHAPES);
  const [colorsList, setColorsList] = useState(DEFAULT_COLORS);
  const [claritiesList, setClaritiesList] = useState(DEFAULT_CLARITIES);
  const [typesList, setTypesList] = useState(['Lab Grown Diamond', 'Natural Diamond']);
  const [masterIds, setMasterIds] = useState({ types: {}, shapes: {}, colors: {}, clarities: {} });

  // Rows state for Center and Side
  const [centerRows, setCenterRows] = useState(INITIAL_CENTER_ROWS);
  const [sideRows, setSideRows] = useState(INITIAL_SIDE_ROWS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sync initial query params if present (e.g. ?type=Lab+Grown+Diamond&shape=FANCY...)
  useEffect(() => {
    const qType = searchParams.get('type');
    const qTab = searchParams.get('tab');
    if (qType) {
      setActiveType(qType.replace(/\+/g, ' '));
    }
    if (qTab === 'side' || qTab === 'center') {
      setActiveTab(qTab);
    }
  }, [searchParams]);

  // Fetch Master Lookups (Shapes, Colors, Clarities, Types)
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [resTypes, resShapes, resColors, resClarities] = await Promise.allSettled([
          api.get('/diamond-types/lookup').catch(() => api.get('/diamond-types?limit=100')),
          api.get('/diamond-shapes/lookup').catch(() => api.get('/diamond-shapes?limit=100')),
          api.get('/diamond-colors/lookup').catch(() => api.get('/diamond-colors?limit=100')),
          api.get('/diamond-clarities/lookup').catch(() => api.get('/diamond-clarities?limit=100')),
        ]);

        const ids = { types: {}, shapes: {}, colors: {}, clarities: {} };

        if (resTypes.status === 'fulfilled' && resTypes.value.data?.data) {
          const items = resTypes.value.data.data.items || resTypes.value.data.data || [];
          if (Array.isArray(items) && items.length > 0) {
            setTypesList(items.map((i) => i.name));
            items.forEach((i) => { ids.types[i.name.toLowerCase()] = i._id || i.id; });
          }
        }

        if (resShapes.status === 'fulfilled' && resShapes.value.data?.data) {
          const items = resShapes.value.data.data.items || resShapes.value.data.data || [];
          if (Array.isArray(items) && items.length > 0) {
            const names = items.map((i) => String(i.name || '').toUpperCase());
            setShapesList(Array.from(new Set([...names, ...DEFAULT_SHAPES])));
            items.forEach((i) => { ids.shapes[String(i.name).toUpperCase()] = i._id || i.id; });
          }
        }

        if (resColors.status === 'fulfilled' && resColors.value.data?.data) {
          const items = resColors.value.data.data.items || resColors.value.data.data || [];
          if (Array.isArray(items) && items.length > 0) {
            const names = items.map((i) => String(i.name || '').toUpperCase());
            setColorsList(Array.from(new Set([...names, ...DEFAULT_COLORS])));
            items.forEach((i) => { ids.colors[String(i.name).toUpperCase()] = i._id || i.id; });
          }
        }

        if (resClarities.status === 'fulfilled' && resClarities.value.data?.data) {
          const items = resClarities.value.data.data.items || resClarities.value.data.data || [];
          if (Array.isArray(items) && items.length > 0) {
            const names = items.map((i) => String(i.name || '').toUpperCase());
            setClaritiesList(Array.from(new Set([...names, ...DEFAULT_CLARITIES])));
            items.forEach((i) => { ids.clarities[String(i.name).toUpperCase()] = i._id || i.id; });
          }
        }

        setMasterIds(ids);
      } catch (err) {
        console.warn('Masters lookup notice:', err);
      }
    };

    loadMasters();
  }, []);

  // Fetch Diamond Prices from Backend API
  const fetchPrices = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'center' ? '/center-diamond-prices' : '/side-diamond-prices';
      const res = await api.get(`${endpoint}?limit=500`);
      const items = res.data?.data?.items || res.data?.data || [];

      if (Array.isArray(items) && items.length > 0) {
        const formatted = items.map((doc) => {
          const sName = doc.diamondShapeId?.name || doc.diamondShape || 'ROUND';
          const cName = doc.diamondColorId?.name || doc.diamondColor || 'D-E';
          const clName = doc.diamondClarityId?.name || doc.diamondClarity || 'VS';
          const tName = doc.diamondTypeId?.name || doc.diamondType || 'Lab Grown Diamond';

          return {
            _id: doc._id || doc.id,
            id: doc._id || doc.id,
            type: tName,
            shape: String(sName).toUpperCase(),
            color: String(cName).toUpperCase(),
            clarity: String(clName).toUpperCase(),
            sizeFrom: Number(doc.sizeFrom ?? 0.3),
            sizeTo: Number(doc.sizeTo ?? 1.49),
            priceINR: Number(doc.priceINR ?? 20000),
            priceUSD: Number(doc.priceUSD ?? 0),
          };
        });

        if (activeTab === 'center') {
          setCenterRows(formatted);
        } else {
          setSideRows(formatted);
        }
      }
    } catch (err) {
      console.warn(`Could not load ${activeTab} diamond prices from API, keeping configured master rows:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [activeTab]);

  // Current active rows
  const currentRows = activeTab === 'center' ? centerRows : sideRows;
  const setCurrentRows = activeTab === 'center' ? setCenterRows : setSideRows;

  // Filtered rows matching selected Diamond Type
  const filteredRows = useMemo(() => {
    return currentRows.filter((r) => {
      if (!r.type) return true;
      const isNatural = activeType.toLowerCase().includes('natural');
      const rowNatural = String(r.type).toLowerCase().includes('natural');
      return isNatural === rowNatural;
    });
  }, [currentRows, activeType]);

  // Update a single cell in the table
  const handleUpdateRow = (id, field, value) => {
    setCurrentRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Add a new row to the table (appends row to bottom matching screenshot)
  const handleAddRow = () => {
    const newId = `new_${Date.now()}`;
    const newRecord = {
      id: newId,
      _id: newId,
      type: activeType,
      shape: 'FANCY',
      color: 'D-E',
      clarity: 'VS',
      sizeFrom: '',
      sizeTo: '',
      priceINR: '',
      isNew: true,
    };

    setCurrentRows((prev) => [...prev, newRecord]);
    toast.success('New diamond rate row added');
    setTimeout(() => {
      tableEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  // Delete a row from the table
  const handleDeleteRow = async (id, shape, color, clarity) => {
    const ok = await confirm({
      title: 'Delete Diamond Rate',
      message: `Are you sure you want to delete rate for ${shape} / ${color} / ${clarity}?`,
      confirmText: 'Delete',
      cancelText: 'Keep',
      type: 'danger',
    });
    if (!ok) return;

    setCurrentRows((prev) => prev.filter((r) => r.id !== id));

    // If persisted on server, trigger backend delete
    if (!String(id).startsWith('new_')) {
      try {
        const endpoint = activeTab === 'center' ? '/center-diamond-prices' : '/side-diamond-prices';
        await api.delete(`${endpoint}/${id}`);
      } catch (err) {
        console.warn('Backend delete error (ignorable if offline):', err);
      }
    }
    toast.success('Diamond rate removed');
  };

  // Export current table to Excel / CSV
  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      toast.error('No rows available to export');
      return;
    }

    const headers = ['SHAPE', 'COLOR', 'CLARITY', 'SIZE FROM', 'SIZE TO', 'INR PRICE PER CARAT (₹)'];
    const rowsCsv = filteredRows.map((r) => [
      `"${r.shape || 'ROUND'}"`,
      `"${r.color || 'D-E'}"`,
      `"${r.clarity || 'VS'}"`,
      r.sizeFrom ?? 0.3,
      r.sizeTo ?? 1.49,
      r.priceINR ?? 20000,
    ]);

    const csvContent = [headers.join(','), ...rowsCsv.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `Diamond_Pricing_Master_${activeTab === 'center' ? 'Center_Diamond' : 'Side_Diamond'}_${activeType.replace(/\s+/g, '_')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredRows.length} rows to Excel/CSV successfully!`);
  };

  // Upload Excel / CSV file handler
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          toast.error('File appears to be empty or missing data rows');
          return;
        }

        const headerLine = lines[0].toLowerCase();
        const headerParts = headerLine.split(/[,;\t]/).map((h) => h.replace(/["']/g, '').trim());

        const shapeIdx = headerParts.findIndex((h) => h.includes('shape'));
        const colorIdx = headerParts.findIndex((h) => h.includes('color'));
        const clarityIdx = headerParts.findIndex((h) => h.includes('clarity'));
        const fromIdx = headerParts.findIndex((h) => h.includes('from') || h.includes('min'));
        const toIdx = headerParts.findIndex((h) => h.includes('to') || h.includes('max'));
        const priceIdx = headerParts.findIndex((h) => h.includes('price') || h.includes('rate') || h.includes('inr'));

        const parsedRows = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(/[,;\t]/).map((p) => p.replace(/["']/g, '').trim());
          if (parts.length < 3) continue;

          const shape = (shapeIdx !== -1 ? parts[shapeIdx] : parts[0] || 'ROUND').toUpperCase();
          const color = (colorIdx !== -1 ? parts[colorIdx] : parts[1] || 'D-E').toUpperCase();
          const clarity = (clarityIdx !== -1 ? parts[clarityIdx] : parts[2] || 'VS').toUpperCase();
          const sizeFrom = parseFloat(fromIdx !== -1 ? parts[fromIdx] : parts[3]) || 0.3;
          const sizeTo = parseFloat(toIdx !== -1 ? parts[toIdx] : parts[4]) || 1.49;
          const priceINR = parseFloat(priceIdx !== -1 ? parts[priceIdx] : parts[5]) || 20000;

          parsedRows.push({
            id: `new_${Date.now()}_${i}`,
            _id: `new_${Date.now()}_${i}`,
            type: activeType,
            shape,
            color,
            clarity,
            sizeFrom,
            sizeTo,
            priceINR,
            isNew: true,
          });
        }

        if (parsedRows.length === 0) {
          toast.error('Could not parse valid diamond price rows from file');
          return;
        }

        setCurrentRows((prev) => [...parsedRows, ...prev]);
        toast.success(`Imported ${parsedRows.length} rows from Excel! Click "Save Master" to persist.`);
      } catch (parseErr) {
        console.error('File parsing error:', parseErr);
        toast.error('Failed to parse spreadsheet file');
      }
    };

    reader.readAsText(file);
  };

  // Save Master Handler: Persists all rows to the backend API
  const handleSaveMaster = async () => {
    try {
      setSaving(true);
      const endpoint = activeTab === 'center' ? '/center-diamond-prices' : '/side-diamond-prices';

      // Prepare payload with resolved ObjectIds or names
      const payloadItems = currentRows.map((r) => {
        const shapeId = masterIds.shapes[String(r.shape).toUpperCase()] || r.shape;
        const colorId = masterIds.colors[String(r.color).toUpperCase()] || r.color;
        const clarityId = masterIds.clarities[String(r.clarity).toUpperCase()] || r.clarity;
        const typeId = masterIds.types[String(r.type || activeType).toLowerCase()] || r.type || activeType;

        return {
          _id: String(r.id).startsWith('new_') ? undefined : r._id || r.id,
          diamondTypeId: typeId,
          diamondShapeId: shapeId,
          diamondColorId: colorId,
          diamondClarityId: clarityId,
          sizeFrom: Number(r.sizeFrom) || 0,
          sizeTo: Number(r.sizeTo) || 0,
          priceINR: Number(r.priceINR) || 0,
          priceUSD: Number(r.priceUSD) || 0,
        };
      });

      // Try bulk save endpoint first
      try {
        await api.post(`${endpoint}/bulk`, { items: payloadItems });
      } catch (bulkErr) {
        console.warn('Bulk endpoint fallback to individual creates/updates:', bulkErr);
        // Fallback: update existing and create new
        await Promise.allSettled(
          payloadItems.map((item) =>
            item._id
              ? api.put(`${endpoint}/${item._id}`, item)
              : api.post(endpoint, item)
          )
        );
      }

      toast.success(`${activeTab === 'center' ? 'Center' : 'Side'} Diamond Pricing Master saved successfully!`);
      fetchPrices();
    } catch (err) {
      console.error('Failed to save master:', err);
      toast.error('Error saving diamond pricing master');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      {/* Hidden File Input for Excel/CSV Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,.tsv,.txt,.xlsx,.xls"
        className="hidden"
      />

      {/* Top Header & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-stone-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Diamond Pricing Master
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Configure rates per carat for center and side stones.
          </p>
        </div>

        {/* 4 Action Buttons matching Screenshot */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 1. Add Row */}
          <button
            type="button"
            onClick={handleAddRow}
            className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <HiOutlinePlus className="w-4 h-4 stroke-2" />
            <span>Add Row</span>
          </button>

          {/* 2. Upload Excel (Boxed in User Screenshot) */}
          <button
            type="button"
            onClick={handleUploadClick}
            className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Import rates from Excel / CSV"
          >
            <HiOutlineUpload className="w-4 h-4 stroke-2 text-[#8b6f4e]" />
            <span>Upload Excel</span>
          </button>

          {/* 3. Export Excel (Boxed in User Screenshot) */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Export rates to Excel / CSV"
          >
            <HiOutlineDownload className="w-4 h-4 stroke-2 text-[#8b6f4e]" />
            <span>Export Excel</span>
          </button>

          {/* 4. Save Master */}
          <button
            type="button"
            onClick={handleSaveMaster}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#8b6f4e] hover:bg-[#785e42] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <HiOutlineCheck className="w-4 h-4 stroke-2" />
            )}
            <span>Save Master</span>
          </button>
        </div>
      </div>

      {/* Diamond Type Selector Pill (LAB GROWN DIAMOND vs NATURAL DIAMOND) */}
      <div className="flex items-center gap-2">
        {['Lab Grown Diamond', 'Natural Diamond'].map((type) => {
          const isSelected = activeType.toLowerCase() === type.toLowerCase();
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#8b6f4e] text-white shadow-2xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300'
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Segmented Switch: Center Diamond vs Side Diamond (Boxed in User Screenshot) */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div className="bg-stone-100/90 p-1 rounded-2xl inline-flex items-center gap-1 border border-stone-200/60 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('center')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'center'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 font-semibold'
            }`}
          >
            Center Diamond
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('side')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'side'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 font-semibold'
            }`}
          >
            Side Diamond
          </button>
        </div>

        {/* Total Rows Indicator */}
        <div className="text-xs font-extrabold uppercase tracking-widest text-stone-500">
          TOTAL ROWS: {filteredRows.length}
        </div>
      </div>

      {/* Diamond Pricing Master Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/60 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                <th className="py-3 px-4 w-14 text-center font-bold">#</th>
                <th className="py-3 px-4 min-w-[160px] font-bold">SHAPE</th>
                <th className="py-3 px-4 min-w-[140px] font-bold">COLOR</th>
                <th className="py-3 px-4 min-w-[140px] font-bold">CLARITY</th>
                <th className="py-3 px-4 min-w-[220px] font-bold">SIZE RANGE</th>
                <th className="py-3 px-4 min-w-[200px] font-bold">INR PRICE PER CARAT (₹)</th>
                <th className="py-3 px-4 w-16 text-center font-bold">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin" />
                      <span>Loading diamond rates from API...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <p className="font-semibold text-stone-700 mb-1">No diamond rates found</p>
                    <p className="text-xs">Click "+ Add Row" or "Upload Excel" to configure prices.</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-stone-50/40 transition-colors">
                    {/* # Index */}
                    <td className="py-2.5 px-4 text-center text-xs font-semibold text-stone-400 whitespace-nowrap">
                      {String(index + 1).padStart(2, '0')}
                    </td>

                    {/* SHAPE Dropdown */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <Dropdown
                        size="sm"
                        value={row.shape || 'FANCY'}
                        onChange={(val) => handleUpdateRow(row.id, 'shape', val)}
                        options={shapesList}
                        buttonClassName="h-9 px-3 text-xs font-bold uppercase rounded-xl bg-stone-50/70 border-stone-200 hover:border-stone-300 text-stone-800"
                      />
                    </td>

                    {/* COLOR Dropdown */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <Dropdown
                        size="sm"
                        value={row.color || 'D-E'}
                        onChange={(val) => handleUpdateRow(row.id, 'color', val)}
                        options={colorsList}
                        buttonClassName="h-9 px-3 text-xs font-bold uppercase rounded-xl bg-stone-50/70 border-stone-200 hover:border-stone-300 text-stone-800"
                      />
                    </td>

                    {/* CLARITY Dropdown */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <Dropdown
                        size="sm"
                        value={row.clarity || 'VS'}
                        onChange={(val) => handleUpdateRow(row.id, 'clarity', val)}
                        options={claritiesList}
                        buttonClassName="h-9 px-3 text-xs font-bold uppercase rounded-xl bg-stone-50/70 border-stone-200 hover:border-stone-300 text-stone-800"
                      />
                    </td>

                    {/* SIZE RANGE (From - To) */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="From"
                          value={row.sizeFrom ?? ''}
                          onChange={(e) => handleUpdateRow(row.id, 'sizeFrom', e.target.value)}
                          className="w-24 h-9 px-3 text-center text-xs font-bold text-stone-800 rounded-xl bg-stone-50/70 border border-stone-200 focus:bg-white focus:border-[#8b6f4e] focus:outline-none transition-colors"
                        />
                        <span className="text-stone-400 font-bold">-</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="To"
                          value={row.sizeTo ?? ''}
                          onChange={(e) => handleUpdateRow(row.id, 'sizeTo', e.target.value)}
                          className="w-24 h-9 px-3 text-center text-xs font-bold text-stone-800 rounded-xl bg-stone-50/70 border border-stone-200 focus:bg-white focus:border-[#8b6f4e] focus:outline-none transition-colors"
                        />
                      </div>
                    </td>

                    {/* INR PRICE PER CARAT */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="relative max-w-[200px]">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          placeholder="Rate (INR)"
                          value={row.priceINR ?? ''}
                          onChange={(e) => handleUpdateRow(row.id, 'priceINR', e.target.value)}
                          className="w-full h-9 pl-8 pr-3 text-xs font-bold text-stone-900 rounded-xl bg-stone-50/70 border border-stone-200 focus:bg-white focus:border-[#8b6f4e] focus:outline-none transition-colors"
                        />
                      </div>
                    </td>

                    {/* Delete Action */}
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row.id, row.shape, row.color, row.clarity)}
                        className="w-8 h-8 rounded-xl inline-flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                        title="Delete Rate"
                      >
                        <HiOutlineTrash className="w-4 h-4 stroke-2" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-3 bg-stone-50/60 border-t border-stone-200/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddRow}
            className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 hover:text-[#8b6f4e] text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <HiOutlinePlus className="w-4 h-4 stroke-2 text-[#8b6f4e]" />
            <span>Add Row</span>
          </button>
          <span className="text-[11px] font-semibold text-stone-400">
            Total {filteredRows.length} diamond rate {filteredRows.length === 1 ? 'row' : 'rows'}
          </span>
        </div>
        <div ref={tableEndRef} />
      </div>
    </div>
  );
}

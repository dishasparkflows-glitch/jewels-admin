import { HiOutlineColorSwatch, HiOutlineSparkles } from 'react-icons/hi';
import toast from 'react-hot-toast';
import ConfigEntityView from '../../components/common/ConfigEntityView';
function MetalSwatch({ startColor = '#F9E498', endColor = '#B38B34', className = 'w-7 h-7' }) {
  const isGradient = startColor && endColor && startColor.toLowerCase() !== endColor.toLowerCase();
  const backgroundStyle = isGradient
    ? { background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)` }
    : { backgroundColor: startColor || endColor || '#d4af37' };

  return (
    <div
      style={backgroundStyle}
      className={`${className} rounded-full border border-stone-200/80 shadow-2xs flex-shrink-0 transition-transform hover:scale-105`}
      title={`${startColor} / ${endColor}`}
    />
  );
}

const METAL_COLOR_LEADING_COLUMNS = [
  {
    header: 'SWATCH',
    render: (c) => <MetalSwatch startColor={c.colorCode} endColor={c.colorCodeEnd} />,
  },
];

const METAL_COLOR_EXTRA_FIELDS = [
  {
    name: 'colorCode',
    label: 'Start Color',
    tableHeader: 'HEX CODE',
    type: 'color',
    required: true,
    gridGroup: 'hexPair',
    defaultValue: '#F9E498',
    renderCell: (c) => (
      <span className="font-mono text-[11px] text-stone-500">
        {`${c.colorCode || '#FFFFFF'}${
          c.colorCodeEnd && c.colorCodeEnd !== c.colorCode ? ` / ${c.colorCodeEnd}` : ''
        }`}
      </span>
    ),
  },
  {
    name: 'colorCodeEnd',
    label: 'End Color',
    type: 'color',
    required: true,
    gridGroup: 'hexPair',
    defaultValue: '#B38B34',
    hideInTable: true,
  },
];

const buildMetalColorStats = (colors) => {
  const activeCount = colors.filter((c) => c.status === 'active').length;
  const dualToneCount = colors.filter(
    (c) => c.colorCodeEnd && c.colorCodeEnd.toLowerCase() !== c.colorCode?.toLowerCase()
  ).length;

  return [
    { label: 'Metal Colors', value: colors.length, icon: HiOutlineColorSwatch, color: 'bronze' },
    { label: 'Active Finishes', value: activeCount, icon: HiOutlineSparkles, color: 'green' },
    { label: 'Dual / Gradient Tones', value: dualToneCount, icon: HiOutlineColorSwatch, color: 'peach' },
    {
      label: 'Single Solid Alloys',
      value: Math.max(0, colors.length - dualToneCount),
      icon: HiOutlineColorSwatch,
      color: 'gold',
    },
  ];
};

export default function MetalColorsView() {
  return (
    <ConfigEntityView
      title="Metal Color"
      singularTitle="Color"
      subtitle="Manage precious metal alloys, rose/yellow/white gold tones and gradient finishes."
      addLabel="Add Color"
      itemLabel="metal colors"
      endpoint="/metal-colors"
      hasIcon={false}
      hasCode={false}
      hasStatusColumn={false}
      hasCreatedDateColumn={false}
      showStatusFilter={false}
      showStatusToggleInModal={false}
      openAddFromRoute={true}
      nameLabel="Color Name"
      nameColumnLabel="COLOR NAME"
      namePlaceholder="e.g. Yellow Gold"
      buildStatCards={buildMetalColorStats}
      leadingColumns={METAL_COLOR_LEADING_COLUMNS}
      extraFields={METAL_COLOR_EXTRA_FIELDS}
      searchMatcher={(c, q) =>
        Boolean(
          (c.colorCode && c.colorCode.toLowerCase().includes(q)) ||
            (c.colorCodeEnd && c.colorCodeEnd.toLowerCase().includes(q))
        )
      }
      renderModalPreview={({ extraValues }) => (
        <div>
          <label className="block text-xs font-bold text-stone-900 mb-1.5">
            Color Gradient Swatches
          </label>
          <div
            style={{
              background: `linear-gradient(to right, ${extraValues.colorCode || '#F9E498'}, ${
                extraValues.colorCodeEnd || '#B38B34'
              })`,
            }}
            className="w-full h-12 rounded-xl shadow-xs border border-stone-200/70 flex items-center justify-center transition-all"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-800/80 drop-shadow-2xs select-none">
              METALLIC SHINE PREVIEW
            </span>
          </div>
        </div>
      )}
      validateAndBuildPayload={({ name, extraValues }) => {
        if (!name.trim()) {
          toast.error('Please enter a color name');
          return null;
        }
        return {
          name: name.trim(),
          colorCode: (extraValues.colorCode || '#F9E498').trim(),
          colorCodeEnd: (extraValues.colorCodeEnd || '#B38B34').trim(),
          status: 'active',
        };
      }}
    />
  );
}

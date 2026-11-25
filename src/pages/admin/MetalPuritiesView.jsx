import { HiOutlineCube, HiOutlineSparkles } from 'react-icons/hi';
import toast from 'react-hot-toast';
import ConfigEntityView from '../../components/common/ConfigEntityView';

const METAL_PURITY_EXTRA_FIELDS = [
  {
    name: 'metalType',
    label: 'Metal Type',
    type: 'select',
    options: ['Gold', 'Silver', 'Platinum'],
    required: true,
    position: 'beforeName',
    placeholder: 'Select Metal Type',
    renderCell: (p) => <span className="text-stone-600 font-medium">{p.metalType || '—'}</span>,
  },
  {
    name: 'karat',
    label: 'Karat Value',
    tableHeader: 'KARAT',
    dynamicLabel: (vals) => (vals.metalType === 'Gold' ? 'Karat Value (KT)' : 'Purity Value / Standard'),
    type: 'number',
    min: 0,
    max: (vals) => (vals.metalType === 'Gold' ? 24 : 1000),
    step: 'any',
    position: 'beforeName',
    placeholder: (vals) =>
      vals.metalType === 'Gold'
        ? 'e.g. 18'
        : vals.metalType === 'Silver'
        ? 'e.g. 92.5 or 925'
        : 'e.g. 95 or 950',
    onChangeExtra: ({ value, extraValues, setName, editingItem }) => {
      if (editingItem || !value) return;
      if (extraValues.metalType === 'Gold') {
        setName(`${value}KT Gold`);
      } else if (extraValues.metalType === 'Silver') {
        setName(value === '92.5' || value === '925' ? '925 Silver' : `${value} Silver`);
      } else if (extraValues.metalType === 'Platinum') {
        setName(value === '95' || value === '950' ? '950 Platinum' : `${value} Platinum`);
      }
    },
    renderCell: (p) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#faf5ee] text-[#8f6d43] border border-[#e8d9c2]">
        {p.karat ? `${p.karat}K` : p.name}
      </span>
    ),
  },
  {
    name: 'order',
    label: 'Display Order',
    tableHeader: 'ORDER',
    type: 'number',
    min: 0,
    step: 1,
    align: 'center',
    position: 'beforeName',
    placeholder: 'e.g. 1, 2, 3...',
    defaultValue: (list) => String((list?.length || 0) + 1),
    renderCell: (p) => (
      <span className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
        {p.order ?? 0}
      </span>
    ),
  },
];

const buildMetalPurityStats = (purities) => {
  const activeCount = purities.filter((p) => p.status === 'active').length;
  const p18 = purities.find((p) => String(p.karat) === '18' || p.name?.includes('18'));
  const primaryStandard = p18?.name || purities[0]?.name || '—';

  return [
    { label: 'Metal Purities', value: purities.length, icon: HiOutlineCube, color: 'bronze' },
    { label: 'Active Standards', value: activeCount, icon: HiOutlineSparkles, color: 'green' },
    { label: 'Flagship Grade', value: primaryStandard, icon: HiOutlineSparkles, color: 'peach' },
    {
      label: 'Supported Metals',
      value: new Set(purities.map((p) => p.metalType).filter(Boolean)).size,
      icon: HiOutlineCube,
      color: 'gold',
    },
  ];
};

export default function MetalPuritiesView() {
  return (
    <ConfigEntityView
      title="Metal Purity"
      singularTitle="Purity"
      subtitle="Manage gold purities (14K, 18K, 22K), density factors and alloy specifications."
      addLabel="Add Purity"
      itemLabel="metal purities"
      endpoint="/metal-purities"
      hasIcon={false}
      hasCode={false}
      hasStatusColumn={false}
      hasCreatedDateColumn={false}
      showStatusFilter={false}
      showStatusToggleInModal={false}
      nameLabel="Purity Name"
      nameColumnLabel="NAME"
      namePlaceholder={(vals) =>
        vals.metalType === 'Gold'
          ? 'e.g. 18KT Gold'
          : vals.metalType === 'Silver'
          ? 'e.g. 925 Silver'
          : 'e.g. 950 Platinum'
      }
      buildStatCards={buildMetalPurityStats}
      extraFields={METAL_PURITY_EXTRA_FIELDS}
      searchMatcher={(p, q) =>
        Boolean(
          (p.karat !== undefined && String(p.karat).includes(q)) ||
            (p.order !== undefined && String(p.order).includes(q)) ||
            (p.metalType && p.metalType.toLowerCase().includes(q))
        )
      }
      validateAndBuildPayload={({ name, extraValues }) => {
        if (!name.trim()) {
          toast.error('Please enter a purity name');
          return null;
        }
        return {
          name: name.trim(),
          metalType: extraValues.metalType || '',
          karat: extraValues.karat ? Number(extraValues.karat) : 0,
          order: extraValues.order !== '' && extraValues.order !== undefined ? Number(extraValues.order) : 0,
          status: 'active',
        };
      }}
    />
  );
}

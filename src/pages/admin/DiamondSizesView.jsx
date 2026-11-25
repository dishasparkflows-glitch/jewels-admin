import { HiOutlineCube, HiOutlineSparkles } from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import ConfigEntityView from '../../components/common/ConfigEntityView';

const DIAMOND_SIZE_EXTRA_FIELDS = [
  {
    name: 'sizeFrom',
    label: 'Size From (mm)',
    tableHeader: 'SIZE FROM (MM)',
    type: 'number',
    step: '0.01',
    min: 0,
    required: true,
    gridGroup: 'sizeRange',
    placeholder: 'e.g. 0.18',
    renderCell: (s) => <span className="font-semibold text-stone-700">{s.sizeFrom} mm</span>,
  },
  {
    name: 'sizeTo',
    label: 'Size To (mm)',
    tableHeader: 'SIZE TO (MM)',
    type: 'number',
    step: '0.01',
    min: 0,
    required: true,
    gridGroup: 'sizeRange',
    placeholder: 'e.g. 0.22',
    renderCell: (s) => <span className="font-semibold text-stone-700">{s.sizeTo} mm</span>,
  },
];

const buildDiamondSizeStats = (sizes) => {
  const activeCount = sizes.filter((s) => s.status === 'active').length;
  const minSize = sizes.length
    ? `${Math.min(...sizes.map((s) => Number(s.sizeFrom) || 999))} mm`
    : '0.8 mm';
  const maxSize = sizes.length
    ? `${Math.max(...sizes.map((s) => Number(s.sizeTo) || 0))} mm`
    : '3.5 mm';

  return [
    { label: 'Size Ranges', value: sizes.length, icon: HiOutlineCube, color: 'bronze' },
    { label: 'Active Ranges', value: activeCount, icon: HiOutlineSparkles, color: 'green' },
    { label: 'Smallest Gauge', value: minSize, icon: IoDiamondOutline, color: 'peach' },
    { label: 'Largest Gauge', value: maxSize, icon: IoDiamondOutline, color: 'gold' },
  ];
};

export default function DiamondSizesView() {
  return (
    <ConfigEntityView
      title="Diamond Sizes"
      singularTitle="Size Range"
      subtitle="Manage and define physical side diamond size ranges, calibrations and millimeter tolerances."
      addLabel="Add Size Range"
      itemLabel="diamond sizes"
      endpoint="/diamond-sizes"
      hasIcon={false}
      hasCode={false}
      hasNameField={false}
      nameColumnLabel="SIZE NAME"
      showStatusFilter={false}
      buildStatCards={buildDiamondSizeStats}
      extraFields={DIAMOND_SIZE_EXTRA_FIELDS}
      searchMatcher={(s, q) =>
        Boolean(
          (s.sizeFrom !== undefined && String(s.sizeFrom).includes(q)) ||
            (s.sizeTo !== undefined && String(s.sizeTo).includes(q))
        )
      }
      validateAndBuildPayload={({ status, extraValues }) => {
        const rawFrom = extraValues.sizeFrom;
        const rawTo = extraValues.sizeTo;
        if (rawFrom === '' || rawFrom === undefined || rawTo === '' || rawTo === undefined) {
          toast.error('Please enter both size from and size to values');
          return null;
        }

        const fromNum = Number(rawFrom);
        const toNum = Number(rawTo);

        if (Number.isNaN(fromNum) || Number.isNaN(toNum)) {
          toast.error('Please enter valid numeric values for size range');
          return null;
        }
        if (fromNum > toNum) {
          toast.error('"Size From" cannot be greater than "Size To"');
          return null;
        }

        return {
          name: `${fromNum} - ${toNum} mm`,
          sizeFrom: fromNum,
          sizeTo: toNum,
          status: status || 'active',
        };
      }}
    />
  );
}

import { useMemo } from 'react';
import Dropdown from './Dropdown';
import {
  HiOutlineDesktopComputer,
  HiOutlineTag,
  HiOutlineViewGrid,
  HiOutlineGift,
  HiOutlineDeviceMobile,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlinePhotograph,
  HiOutlineCollection,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';

/**
 * Standard image placement options matching the backend Gallery model enum:
 * ['herobanner', 'collectionbanner', 'categorybanner', 'offerbanner', 'celebrate', 'mobileappbanner', 'bookappointbanner', 'customizebanner', 'asset']
 */
export const PLACEMENT_OPTIONS = [
  {
    value: 'herobanner',
    label: 'Hero Banner',
    icon: HiOutlineDesktopComputer,
  },
  {
    value: 'collectionbanner',
    label: 'Collection Banner',
    icon: HiOutlineTag,
  },
  {
    value: 'categorybanner',
    label: 'Category Banner',
    icon: HiOutlineViewGrid,
  },
  {
    value: 'offerbanner',
    label: 'Offer Banner',
    icon: HiOutlineGift,
  },
  {
    value: 'celebrate',
    label: 'Celebrate & Gifts',
    icon: IoDiamondOutline,
  },
  {
    value: 'mobileappbanner',
    label: 'Mobile App Banner',
    icon: HiOutlineDeviceMobile,
  },
  {
    value: 'bookappointbanner',
    label: 'Appointment Banner',
    icon: HiOutlineCalendar,
  },
  {
    value: 'customizebanner',
    label: 'Custom Banner',
    icon: HiOutlineSparkles,
  },
  {
    value: 'asset',
    label: 'Media Library Asset',
    icon: HiOutlinePhotograph,
  },
];

export const PLACEMENT_LABELS = {
  herobanner: 'Hero Banner',
  collectionbanner: 'Collection Banner',
  categorybanner: 'Category Banner',
  offerbanner: 'Offer Banner',
  celebrate: 'Celebrate & Gifts',
  mobileappbanner: 'Mobile App Banner',
  bookappointbanner: 'Appointment Banner',
  customizebanner: 'Custom Banner',
  websitebanner: 'Website Banner',
  asset: 'Media Library Asset',
};

export const FILTER_PLACEMENT_OPTIONS = [
  {
    value: 'all',
    label: 'All Placements',
    icon: HiOutlineCollection,
  },
  ...PLACEMENT_OPTIONS,
];

/**
 * Unified PlacementSelect Component
 *
 * Used across Media Gallery, Upload Modal, Edit Modal, Theme Media Library,
 * and Media Picker Modal for consistent placement options, icons, and behavior.
 */
export default function PlacementSelect({
  value,
  onChange,
  includeAll = false,
  allLabel = 'All Placements',
  options: customOptions,
  placeholder,
  size = 'field',
  portal = true,
  menuClassName = 'z-[10000]',
  className = '',
  buttonClassName = '',
  disabled = false,
  ...rest
}) {
  const options = useMemo(() => {
    if (customOptions && customOptions.length > 0) return customOptions;
    if (includeAll) {
      return [
        {
          value: 'all',
          label: allLabel,
          icon: HiOutlineCollection,
        },
        ...PLACEMENT_OPTIONS,
      ];
    }
    return PLACEMENT_OPTIONS;
  }, [customOptions, includeAll, allLabel]);

  const defaultPlaceholder = includeAll ? allLabel : 'Select placement type…';

  return (
    <Dropdown
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder || defaultPlaceholder}
      size={size}
      portal={portal}
      menuClassName={menuClassName}
      className={className}
      buttonClassName={buttonClassName}
      disabled={disabled}
      {...rest}
    />
  );
}

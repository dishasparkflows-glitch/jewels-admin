import PropTypes from 'prop-types';

/**
 * Universal Serial Number (SR NO) table cell component for admin portal.
 * Standardizes `(currentPage - 1) * pageSize + index + 1` across all data tables.
 *
 * Usage:
 *   <TableSrNo currentPage={currentPage} pageSize={pageSize} index={idx} />
 *   or:
 *   <SrNoCell currentPage={currentPage} pageSize={pageSize} index={idx} />
 */
export default function TableSrNo({
  currentPage = 1,
  pageSize = 10,
  index = 0,
  className = 'py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap',
}) {
  const srNo = (Number(currentPage) - 1) * Number(pageSize) + Number(index) + 1;
  return <td className={className}>{srNo}</td>;
}

export const SrNoCell = TableSrNo;

/**
 * Pure calculation function for serial number.
 */
export function getSrNo(currentPage = 1, pageSize = 10, index = 0) {
  return (Number(currentPage) - 1) * Number(pageSize) + Number(index) + 1;
}

/**
 * Standard table header for SR NO column.
 */
export function TableSrNoHeader({
  className = 'py-2.5 px-2 text-center whitespace-nowrap text-stone-500 font-bold',
  label = 'SR NO',
}) {
  return <th className={className}>{label}</th>;
}

TableSrNo.propTypes = {
  currentPage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  pageSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  index: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
};

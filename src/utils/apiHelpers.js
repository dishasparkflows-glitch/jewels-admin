/**
 * Shared API Response Extraction Helpers
 */

/**
 * Extract an array of records from common backend pagination/data envelopes.
 * @param {Object} res - Axios response object
 * @param {...string} extraKeys - Optional fallback nested keys on res.data.data or res.data
 * @returns {Array}
 */
export function extractListItems(res, ...extraKeys) {
  const payload = res?.data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;

  for (const key of extraKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(res?.data?.[key])) return res.data[key];
  }

  return [];
}

/**
 * Extract total item count from standard pagination metadata, falling back cleanly.
 * @param {Object} res - Axios response object
 * @param {number} [fallback=0]
 * @returns {number}
 */
export function extractPaginationTotal(res, fallback = 0) {
  const pagination = res?.data?.pagination || res?.data?.data?.pagination;
  if (pagination?.totalDocs !== undefined) return pagination.totalDocs;
  if (pagination?.totalItems !== undefined) return pagination.totalItems;
  if (pagination?.total !== undefined) return pagination.total;
  return fallback;
}

/**
 * Shared Browser File Download Helpers (Blob, CSV, JSON, PDF, etc.)
 */

/**
 * Trigger a browser file download from a Blob, string, ArrayBuffer, or Uint8Array.
 *
 * @param {Blob|BlobPart} data - File contents or Blob instance
 * @param {string} filename - Download filename
 * @param {string} [mimeType='application/octet-stream'] - MIME type when constructing a Blob
 */
export function downloadBlob(data, filename, mimeType = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape a single CSV cell value by wrapping in double quotes and escaping embedded quotes.
 *
 * @param {*} value
 * @returns {string}
 */
export function escapeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  return `"${String(value).replace(/"/g, '""')}"`;
}

/**
 * Build and download a CSV file.
 * Accepts either explicit `(headers, rows, filename)` or `(records, null, filename)` where `records` is an array of objects.
 *
 * @param {string[]|Object[]} headersOrRecords - Column headers array, or array of plain row objects
 * @param {Array<Array<*>>|null} rows - 2D array of row cell values (omit/null when passing objects in first arg)
 * @param {string} filename - Target .csv filename
 */
export function downloadCsv(headersOrRecords, rows, filename) {
  let csvLines = [];

  if (Array.isArray(rows)) {
    const headerLine = (headersOrRecords || []).join(',');
    const bodyLines = rows.map((row) => row.join(','));
    csvLines = [headerLine, ...bodyLines];
  } else {
    const records = Array.isArray(headersOrRecords) ? headersOrRecords : [];
    const headerKeys = Object.keys(records[0] || {});
    const headerLine = headerKeys.join(',');
    const bodyLines = records.map((row) =>
      Object.values(row)
        .map((val) => escapeCsvCell(val))
        .join(',')
    );
    csvLines = [headerLine, ...bodyLines];
  }

  downloadBlob(csvLines.join('\n'), filename, 'text/csv;charset=utf-8;');
}

/**
 * Serialize data as pretty-printed JSON and trigger a browser download.
 *
 * @param {*} data - JSON-serializable data
 * @param {string} filename - Target .json filename
 */
export function downloadJson(data, filename) {
  downloadBlob(JSON.stringify(data, null, 2), filename, 'application/json');
}

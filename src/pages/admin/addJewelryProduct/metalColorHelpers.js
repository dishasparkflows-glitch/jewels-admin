// Metal Colors master registry from backend lookup API (uses colorCode & colorCodeEnd directly)
export const _metalColorsMasterMap = new Map();

export const registerMetalColors = (list = []) => {
  if (!Array.isArray(list)) return;
  list.forEach((item) => {
    if (item?.name && item?.colorCode) {
      _metalColorsMasterMap.set(item.name.toLowerCase().trim(), {
        colorCode: item.colorCode,
        colorCodeEnd: item.colorCodeEnd || item.colorCode,
      });
    }
  });
};

// Direct Swatch generator using database colorCode and colorCodeEnd
export const getSphereStyle = (color = '') => {
  let start = '';
  let end = '';

  if (color && typeof color === 'object') {
    start = color.colorCode || '';
    end = color.colorCodeEnd || start;
  } else if (typeof color === 'string') {
    const match = _metalColorsMasterMap.get(color.toLowerCase().trim());
    if (match) {
      start = match.colorCode;
      end = match.colorCodeEnd;
    }
  }

  if (!start) {
    return {
      gradient: 'transparent',
      background: 'transparent',
      backgroundColor: 'transparent',
      shadow: 'none',
    };
  }

  const gradient =
    start.toLowerCase() === (end || '').toLowerCase()
      ? start
      : `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;

  return {
    gradient,
    background: gradient,
    backgroundColor: start,
    shadow: '0 1px 3px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.4)',
  };
};

export const menuId = (value) => String(value?._id || value || '');
export function selectedMenuIds(record = {}) {
  const source = record.menuItemIds || [];
  return [...new Set((Array.isArray(source) ? source : [source]).map(menuId).filter(Boolean))];
}
export function groupMenuItems(categories, sections, items) {
  const sorted = (rows) => [...rows].sort((a, b) => (a.order || 0) - (b.order || 0));
  return sorted(categories).map((category) => ({
    ...category,
    sections: sorted(sections.filter((section) => menuId(section.categoryId) === menuId(category))).map((section) => ({
      ...section, items: sorted(items.filter((item) => menuId(item.menuSectionId) === menuId(section))),
    })).filter((section) => section.items.length),
  })).filter((category) => category.sections.length);
}

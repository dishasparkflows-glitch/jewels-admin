import { navSections } from '../config/navigation';

/**
 * Checks whether a single module ID is allowed under the active allowedModules list.
 * When allowedModules is null/undefined, full access is granted.
 */
export function isModuleAllowed(moduleId, allowedModules) {
  if (!Array.isArray(allowedModules)) return true;
  if (!moduleId) return false;
  return allowedModules.includes(moduleId);
}

/**
 * Filters navSections so that only allowed modules (and non-empty parent groups) appear.
 */
export function filterNavSections(sections = navSections, allowedModules = null) {
  if (!Array.isArray(allowedModules)) return sections;

  const allowedSet = new Set(allowedModules);

  return sections
    .map((section) => {
      const filteredItems = (section.items || [])
        .map((item) => {
          if (item.children && item.children.length > 0) {
            const visibleChildren = item.children.filter((child) => allowedSet.has(child.id));
            if (visibleChildren.length === 0) return null;
            return { ...item, children: visibleChildren };
          }
          return allowedSet.has(item.id) ? item : null;
        })
        .filter(Boolean);

      if (filteredItems.length === 0) return null;
      return { ...section, items: filteredItems };
    })
    .filter(Boolean);
}

/**
 * Returns a flat list of module definitions derived from navigation.js as a fallback/sync list.
 */
export function getNavigationModuleFallback() {
  const modules = [];
  const seen = new Set();

  navSections.forEach((section) => {
    const defaultGroup = section.title || 'General';
    (section.items || []).forEach((item) => {
      if (item.id === 'owners') return;
      if (item.children && item.children.length > 0) {
        item.children.forEach((child) => {
          if (!seen.has(child.id)) {
            seen.add(child.id);
            modules.push({
              id: child.id,
              title: child.title,
              group: item.title || defaultGroup,
              path: child.path,
            });
          }
        });
      } else if (!seen.has(item.id)) {
        seen.add(item.id);
        modules.push({
          id: item.id,
          title: item.title,
          group: defaultGroup === 'ANALYTICS & ADMINISTRATION' ? 'Analytics & Administration' : defaultGroup,
          path: item.path,
        });
      }
    });
  });

  return modules;
}

const ROUTE_MODULE_RULES = [
  { prefix: '/dashboard', moduleId: 'dashboard' },
  { prefix: '/catalog/jewelry-products', moduleId: 'jewelry-products' },
  { prefix: '/catalog/add-jewelry-product', moduleId: 'jewelry-products' },
  { prefix: '/add-jewelry-product', moduleId: 'jewelry-products' },
  { prefix: '/catalog/silver-products', moduleId: 'silver-products' },
  { prefix: '/catalog/ornate-products', moduleId: 'ornate-products' },
  { prefix: '/ornate-products', moduleId: 'ornate-products' },
  { prefix: '/collections', moduleId: 'ornate-products' },
  { prefix: '/diamonds', moduleId: 'diamonds' },
  { prefix: '/catalog/categories', moduleId: 'categories' },
  { prefix: '/categories', moduleId: 'categories' },
  { prefix: '/catalog/category-filters', moduleId: 'category-filters' },
  { prefix: '/category-filters', moduleId: 'category-filters' },
  { prefix: '/catalog/navigation-menus', moduleId: 'navigation-menus' },
  { prefix: '/navigation-menus', moduleId: 'navigation-menus' },
  { prefix: '/pricing-hub/metal-rates', moduleId: 'metal-rates' },
  { prefix: '/metal-rates', moduleId: 'metal-rates' },
  { prefix: '/goldprice', moduleId: 'metal-rates' },
  { prefix: '/pricing-hub/diamond-rates', moduleId: 'diamond-rates' },
  { prefix: '/pricing-hub/diamond-price', moduleId: 'diamond-rates' },
  { prefix: '/diamondprice', moduleId: 'diamond-rates' },
  { prefix: '/diamond-price', moduleId: 'diamond-rates' },
  { prefix: '/diamond-rates', moduleId: 'diamond-rates' },
  { prefix: '/currencies', moduleId: 'currencies' },
  { prefix: '/pricing-hub/currencies', moduleId: 'currencies' },
  { prefix: '/metal-purity', moduleId: 'metal-purity' },
  { prefix: '/product-config/metal-purity', moduleId: 'metal-purity' },
  { prefix: '/metal-color', moduleId: 'metal-color' },
  { prefix: '/product-config/metal-color', moduleId: 'metal-color' },
  { prefix: '/sizes', moduleId: 'sizes' },
  { prefix: '/product-config/sizes', moduleId: 'sizes' },
  { prefix: '/vto-masters', moduleId: 'vto-masters' },
  { prefix: '/product-config/vto-masters', moduleId: 'vto-masters' },
  { prefix: '/diamond-types', moduleId: 'diamond-types' },
  { prefix: '/diamond-config/types', moduleId: 'diamond-types' },
  { prefix: '/diamond-shapes', moduleId: 'diamond-shapes' },
  { prefix: '/diamond-config/shapes', moduleId: 'diamond-shapes' },
  { prefix: '/diamond-color', moduleId: 'diamond-color' },
  { prefix: '/diamond-config/color', moduleId: 'diamond-color' },
  { prefix: '/diamond-clarity', moduleId: 'diamond-clarity' },
  { prefix: '/diamond-config/clarity', moduleId: 'diamond-clarity' },
  { prefix: '/diamond-size', moduleId: 'diamond-size' },
  { prefix: '/diamond-config/size', moduleId: 'diamond-size' },
  { prefix: '/gemstone-types', moduleId: 'gemstone-types' },
  { prefix: '/gemstone-config/types', moduleId: 'gemstone-types' },
  { prefix: '/gemstone-shapes', moduleId: 'gemstone-shapes' },
  { prefix: '/gemstone-config/shapes', moduleId: 'gemstone-shapes' },
  { prefix: '/orders', moduleId: 'all-orders' },
  { prefix: '/returns', moduleId: 'returns' },
  { prefix: '/custom-inquiries', moduleId: 'custom-inquiries' },
  { prefix: '/cod-sequences', moduleId: 'cod-sequence' },
  { prefix: '/cod-sequence', moduleId: 'cod-sequence' },
  { prefix: '/customers', moduleId: 'customers' },
  { prefix: '/appointments', moduleId: 'appointments' },
  { prefix: '/reviews', moduleId: 'reviews' },
  { prefix: '/home-sections', moduleId: 'home-sections' },
  { prefix: '/marketing/home-sections', moduleId: 'home-sections' },
  { prefix: '/banners', moduleId: 'banners' },
  { prefix: '/marketing/banners', moduleId: 'banners' },
  { prefix: '/top-announcement', moduleId: 'banners' },
  { prefix: '/top-announcements', moduleId: 'banners' },
  { prefix: '/celebrate-gifts', moduleId: 'celebrate-gifts' },
  { prefix: '/marketing/gifts', moduleId: 'celebrate-gifts' },
  { prefix: '/marketing/celebrate-gifts', moduleId: 'celebrate-gifts' },
  { prefix: '/coupons', moduleId: 'offers' },
  { prefix: '/marketing/coupons', moduleId: 'offers' },
  { prefix: '/birthstones', moduleId: 'birthstones' },
  { prefix: '/marketing/birthstones', moduleId: 'birthstones' },
  { prefix: '/marketing/before-after', moduleId: 'before-after' },
  { prefix: '/before-after', moduleId: 'before-after' },
  { prefix: '/gallery', moduleId: 'gallery' },
  { prefix: '/media-gallery', moduleId: 'gallery' },
  { prefix: '/marketing/gallery', moduleId: 'gallery' },
  { prefix: '/themes', moduleId: 'themes' },
  { prefix: '/website/themes', moduleId: 'themes' },
  { prefix: '/instagram-posts', moduleId: 'instagram' },
  { prefix: '/marketing/instagram', moduleId: 'instagram' },
  { prefix: '/blogs', moduleId: 'blogs' },
  { prefix: '/marketing/blogs', moduleId: 'blogs' },
  { prefix: '/blog-categories', moduleId: 'blog-categories' },
  { prefix: '/marketing/blog-categories', moduleId: 'blog-categories' },
  { prefix: '/static-pages', moduleId: 'static-pages' },
  { prefix: '/website/static-pages', moduleId: 'static-pages' },
  { prefix: '/reports', moduleId: 'reports' },
  { prefix: '/analytics', moduleId: 'reports' },
  { prefix: '/system/whatsapp', moduleId: 'whatsapp' },
  { prefix: '/whatsapp', moduleId: 'whatsapp' },
  { prefix: '/profile', moduleId: 'profile' },
  { prefix: '/theme', moduleId: 'profile' },
  { prefix: '/user-profile', moduleId: 'profile' },
  { prefix: '/settings', moduleId: 'settings' },
  { prefix: '/owners', moduleId: 'owners' },
  { prefix: '/clients', moduleId: 'owners' },
];

/**
 * Resolves the module ID for an admin route pathname.
 */
export function getModuleIdForPath(pathname = '') {
  const path = String(pathname || '').toLowerCase();
  const match = ROUTE_MODULE_RULES.find(
    (rule) => path === rule.prefix || path.startsWith(`${rule.prefix}/`)
  );
  return match?.moduleId || null;
}

/**
 * Checks if a given admin pathname is accessible under allowedModules.
 */
export function isPathAllowed(pathname, allowedModules) {
  if (!Array.isArray(allowedModules)) return true;
  const moduleId = getModuleIdForPath(pathname);
  if (!moduleId) return true;
  return allowedModules.includes(moduleId);
}

/**
 * Finds the first allowed menu path for redirect fallback.
 */
export function getFirstAllowedPath(allowedModules) {
  const filtered = filterNavSections(navSections, allowedModules);
  for (const section of filtered) {
    for (const item of section.items || []) {
      if (item.children?.length > 0) {
        return item.children[0].path;
      }
      if (item.path) return item.path;
    }
  }
  return null;
}

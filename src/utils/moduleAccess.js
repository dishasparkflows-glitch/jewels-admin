import { HiOutlineViewGrid } from 'react-icons/hi';
import { navSections } from '../config/navigation';

const SIDEBAR_HIDDEN_SLUGS = new Set(['profile']);

/**
 * Checks whether a single module slug is allowed under the active allowedModules list.
 * When allowedModules is null/undefined, full access is granted.
 */
export function isModuleAllowed(slug, allowedModules) {
  if (!Array.isArray(allowedModules)) return true;
  if (!slug) return false;
  return allowedModules.includes(slug);
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
 * Merges navigation config with module rows loaded from the database `modules` collection
 * (filtering by `status: 'active'`, applying DB `name`/`path`, and appending any extra active DB modules),
 * then applies owner-level `allowedModules` filtering.
 */
export function resolveNavSections(sections = navSections, dbModules = null, allowedModules = null) {
  let resolved = sections;

  if (Array.isArray(dbModules) && dbModules.length > 0) {
    const getModKey = (mod) => mod?.slug || mod?.moduleId || mod?.id;
    const dbMap = new Map(
      dbModules
        .map((mod) => [getModKey(mod), mod])
        .filter(([id]) => Boolean(id))
    );
    const seenIds = new Set();

    const mapLeaf = (item) => {
      seenIds.add(item.id);
      const dbMod = dbMap.get(item.id);

      if (!dbMod || dbMod.status !== 'active') return null;

      return {
        ...item,
        title: dbMod.name || item.title,
        path: dbMod.path || item.path,
      };
    };

    resolved = sections
      .map((section) => {
        const mappedItems = (section.items || [])
          .map((item) => {
            if (item.children && item.children.length > 0) {
              const visibleChildren = item.children.map(mapLeaf).filter(Boolean);
              if (visibleChildren.length === 0) return null;
              return { ...item, children: visibleChildren };
            }
            return mapLeaf(item);
          })
          .filter(Boolean);

        if (mappedItems.length === 0) return null;
        return { ...section, items: mappedItems };
      })
      .filter(Boolean);

    const extraActive = dbModules.filter((mod) => {
      const key = getModKey(mod);
      return (
        mod?.status === 'active' &&
        key &&
        !SIDEBAR_HIDDEN_SLUGS.has(key) &&
        !seenIds.has(key) &&
        mod.path
      );
    });
    if (extraActive.length > 0) {
      resolved = resolved.map((sec) => ({
        ...sec,
        items: sec.items.map((it) => (it.children ? { ...it, children: [...it.children] } : { ...it })),
      }));

      extraActive.forEach((mod) => {
        const modId = getModKey(mod);
        const leaf = {
          id: modId,
          title: mod.name || mod.title || modId,
          path: mod.path,
          icon: HiOutlineViewGrid,
        };
        const groupLower = String(mod.group || '').toLowerCase();
        let placed = false;

        for (const sec of resolved) {
          for (const it of sec.items) {
            if (it.children && String(it.title || '').toLowerCase() === groupLower) {
              it.children.push(leaf);
              placed = true;
              break;
            }
          }
          if (placed) break;
        }

        if (!placed) {
          const targetSec =
            resolved.find((s) => String(s.title || '').toLowerCase() === groupLower) ||
            resolved[resolved.length - 1];
          if (targetSec) {
            targetSec.items.push(leaf);
          }
        }
      });
    }
  }

    return filterNavSections(resolved, allowedModules);
}

const ROUTE_MODULE_RULES = [
  { prefix: '/dashboard', slug: 'dashboard' },
  { prefix: '/catalog/jewelry-products', slug: 'jewelry-products' },
  { prefix: '/catalog/add-jewelry-product', slug: 'jewelry-products' },
  { prefix: '/add-jewelry-product', slug: 'jewelry-products' },
  { prefix: '/catalog/silver-products', slug: 'silver-products' },
  { prefix: '/catalog/ornate-products', slug: 'ornate-products' },
  { prefix: '/ornate-products', slug: 'ornate-products' },
  { prefix: '/collections', slug: 'ornate-products' },
  { prefix: '/diamonds', slug: 'diamonds' },
  { prefix: '/catalog/categories', slug: 'categories' },
  { prefix: '/categories', slug: 'categories' },
  { prefix: '/catalog/category-filters', slug: 'category-filters' },
  { prefix: '/category-filters', slug: 'category-filters' },
  { prefix: '/catalog/navigation-menus', slug: 'navigation-menus' },
  { prefix: '/navigation-menus', slug: 'navigation-menus' },
  { prefix: '/pricing-hub/metal-rates', slug: 'metal-rates' },
  { prefix: '/metal-rates', slug: 'metal-rates' },
  { prefix: '/goldprice', slug: 'metal-rates' },
  { prefix: '/pricing-hub/diamond-rates', slug: 'diamond-rates' },
  { prefix: '/pricing-hub/diamond-price', slug: 'diamond-rates' },
  { prefix: '/diamondprice', slug: 'diamond-rates' },
  { prefix: '/diamond-price', slug: 'diamond-rates' },
  { prefix: '/diamond-rates', slug: 'diamond-rates' },
  { prefix: '/currencies', slug: 'currencies' },
  { prefix: '/pricing-hub/currencies', slug: 'currencies' },
  { prefix: '/metal-purity', slug: 'metal-purity' },
  { prefix: '/product-config/metal-purity', slug: 'metal-purity' },
  { prefix: '/metal-color', slug: 'metal-color' },
  { prefix: '/product-config/metal-color', slug: 'metal-color' },
  { prefix: '/sizes', slug: 'sizes' },
  { prefix: '/product-config/sizes', slug: 'sizes' },
  { prefix: '/vto-masters', slug: 'vto-masters' },
  { prefix: '/product-config/vto-masters', slug: 'vto-masters' },
  { prefix: '/diamond-types', slug: 'diamond-types' },
  { prefix: '/diamond-config/types', slug: 'diamond-types' },
  { prefix: '/diamond-shapes', slug: 'diamond-shapes' },
  { prefix: '/diamond-config/shapes', slug: 'diamond-shapes' },
  { prefix: '/diamond-color', slug: 'diamond-color' },
  { prefix: '/diamond-config/color', slug: 'diamond-color' },
  { prefix: '/diamond-clarity', slug: 'diamond-clarity' },
  { prefix: '/diamond-config/clarity', slug: 'diamond-clarity' },
  { prefix: '/diamond-size', slug: 'diamond-size' },
  { prefix: '/diamond-config/size', slug: 'diamond-size' },
  { prefix: '/gemstone-types', slug: 'gemstone-types' },
  { prefix: '/gemstone-config/types', slug: 'gemstone-types' },
  { prefix: '/gemstone-shapes', slug: 'gemstone-shapes' },
  { prefix: '/gemstone-config/shapes', slug: 'gemstone-shapes' },
  { prefix: '/orders', slug: 'all-orders' },
  { prefix: '/returns', slug: 'returns' },
  { prefix: '/custom-inquiries', slug: 'custom-inquiries' },
  { prefix: '/cod-sequences', slug: 'cod-sequence' },
  { prefix: '/cod-sequence', slug: 'cod-sequence' },
  { prefix: '/customers', slug: 'customers' },
  { prefix: '/appointments', slug: 'appointments' },
  { prefix: '/reviews', slug: 'reviews' },
  { prefix: '/home-sections', slug: 'home-sections' },
  { prefix: '/marketing/home-sections', slug: 'home-sections' },
  { prefix: '/banners', slug: 'banners' },
  { prefix: '/marketing/banners', slug: 'banners' },
  { prefix: '/stores', slug: 'stores' },
  { prefix: '/top-announcement', slug: 'banners' },
  { prefix: '/top-announcements', slug: 'banners' },
  { prefix: '/celebrate-gifts', slug: 'celebrate-gifts' },
  { prefix: '/marketing/gifts', slug: 'celebrate-gifts' },
  { prefix: '/marketing/celebrate-gifts', slug: 'celebrate-gifts' },
  { prefix: '/coupons', slug: 'offers' },
  { prefix: '/marketing/coupons', slug: 'offers' },
  { prefix: '/birthstones', slug: 'birthstones' },
  { prefix: '/marketing/birthstones', slug: 'birthstones' },
  { prefix: '/marketing/before-after', slug: 'before-after' },
  { prefix: '/before-after', slug: 'before-after' },
  { prefix: '/gallery', slug: 'gallery' },
  { prefix: '/media-gallery', slug: 'gallery' },
  { prefix: '/marketing/gallery', slug: 'gallery' },
  { prefix: '/themes', slug: 'themes' },
  { prefix: '/website/themes', slug: 'themes' },
  { prefix: '/instagram-posts', slug: 'instagram' },
  { prefix: '/marketing/instagram', slug: 'instagram' },
  { prefix: '/blogs', slug: 'blogs' },
  { prefix: '/marketing/blogs', slug: 'blogs' },
  { prefix: '/blog-categories', slug: 'blog-categories' },
  { prefix: '/marketing/blog-categories', slug: 'blog-categories' },
  { prefix: '/static-pages', slug: 'static-pages' },
  { prefix: '/website/static-pages', slug: 'static-pages' },
  { prefix: '/reports', slug: 'reports' },
  { prefix: '/analytics', slug: 'reports' },
  { prefix: '/system/whatsapp', slug: 'whatsapp' },
  { prefix: '/whatsapp', slug: 'whatsapp' },
  { prefix: '/notifications', slug: 'notifications' },
  { prefix: '/profile', slug: 'profile' },
  { prefix: '/theme', slug: 'profile' },
  { prefix: '/user-profile', slug: 'profile' },
  { prefix: '/settings', slug: 'settings' },
  { prefix: '/owners', slug: 'owners' },
  { prefix: '/clients', slug: 'owners' },
];

/**
 * Resolves the module slug for an admin route pathname.
 */
export function getSlugForPath(pathname = '') {
  const path = String(pathname || '').toLowerCase();
  const match = ROUTE_MODULE_RULES.find(
    (rule) => path === rule.prefix || path.startsWith(`${rule.prefix}/`)
  );
  return match?.slug || null;
}

/**
 * Checks if a given admin pathname is accessible under allowedModules and database modules.
 */
export function isPathAllowed(pathname, allowedModules, dbModules = null) {
  const slug = getSlugForPath(pathname);
  if (!slug) return true;

  if (Array.isArray(dbModules) && dbModules.length > 0) {
    const dbMod = dbModules.find((m) => (m?.slug || m?.moduleId || m?.id) === slug);
    if (!dbMod || dbMod.status !== 'active') return false;
  }

  if (!Array.isArray(allowedModules)) return true;
  return allowedModules.includes(slug);
}

/**
 * Finds the first allowed menu path for redirect fallback.
 */
export function getFirstAllowedPath(allowedModules, dbModules = null) {
  const filtered = resolveNavSections(navSections, dbModules, allowedModules);
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

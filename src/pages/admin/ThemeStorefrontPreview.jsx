import React, { useState } from 'react';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineSearch,
  HiOutlineHeart,
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiOutlineDeviceMobile,
  HiOutlineDesktopComputer,
  HiOutlineExternalLink,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';

export default function ThemeStorefrontPreview({
  config = {},
  availableBanners = [],
  availableFeatured = [],
  categories = [],
  previewMedia = [],
  onSelectSection,
  previewMode = 'desktop',
  setPreviewMode,
  themeName = 'Storefront Preview',
}) {
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);

  // Extract tokens
  const colors = config.colors || {
    primary: '#8B6C3A',
    secondary: '#EADCC8',
    background: '#FBF9F5',
    surface: '#FFFFFF',
    text: '#29251F',
    accent: '#A67536',
  };
  const typography = config.typography || {
    headingFont: 'Cormorant Garamond',
    bodyFont: 'Montserrat',
  };
  const borderRadius = config.borderRadius ?? 8;
  const buttonStyle = config.buttonStyle || 'filled';

  // Resolve media overrides helper
  const resolveOverride = (module, recordId, slot, fallbackUrl) => {
    const override = (previewMedia || []).find(
      (row) =>
        row.module === module &&
        String(row.recordId) === String(recordId) &&
        row.slot === slot &&
        row.asset?.url
    );
    return override?.asset?.url || fallbackUrl || '';
  };

  // 1. Resolve Hero Banners
  const bannerSelections = config.bannerSelections || [];
  const heroSelections = bannerSelections
    .filter((s) => s.type === 'herobanner' && (previewMode === 'mobile' ? s.platform === 'mobile' || s.platform === 'web' : s.platform === 'web') && s.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const resolvedHeroSlides = heroSelections.map((selection) => {
    const banner = availableBanners.find((b) => String(b._id) === String(selection.bannerId?._id || selection.bannerId));
    const title = banner?.content?.title || banner?.title || 'Sparkle Brighter This Diwali';
    const subtitle = banner?.content?.subtitle || banner?.subtitle || 'Diwali Special';
    const description = banner?.content?.description || banner?.description || 'Celebrate with timeless elegance.';
    const buttonText = banner?.content?.buttonText || 'SHOP NOW';
    const link = banner?.link || '/shop';
    const rawImage = (previewMode === 'mobile' && banner?.mobileImage?.url) ? banner.mobileImage.url : (banner?.image?.url || '');
    const imageUrl = resolveOverride('banner', banner?._id, 'image', rawImage);
    return {
      id: banner?._id || selection.bannerId,
      title,
      subtitle,
      description,
      buttonText,
      link,
      imageUrl,
    };
  }).filter((s) => s.id);

  // Fallback hero if none selected
  const defaultHeroSlides = [
    {
      id: 'default-1',
      title: 'Sparkle Brighter This Diwali',
      subtitle: 'Diwali Special',
      description: 'Celebrate with timeless elegance.',
      buttonText: 'SHOP NOW',
      link: '/shop',
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'default-2',
      title: 'Traditional Elegance & Grace',
      subtitle: 'Handcrafted Heritage',
      description: 'Exclusive 22KT gold & certified solitaire jewellery.',
      buttonText: 'EXPLORE COLLECTIONS',
      link: '/shop',
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const heroSlides = resolvedHeroSlides.length > 0 ? resolvedHeroSlides : defaultHeroSlides;
  const currentHero = heroSlides[activeHeroIdx % heroSlides.length] || heroSlides[0];

  // 2. Resolve Celebrate & Gifts
  const featuredSelections = config.featuredSelections || [];
  const selectedCelebrate = featuredSelections
    .filter((s) => (s.placement || 'Celebrate') === 'Celebrate' && s.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((s) => availableFeatured.find((f) => String(f._id) === String(s.featuredId?._id || s.featuredId)))
    .filter(Boolean);

  const fallbackCelebrate = (availableFeatured || []).filter((f) => f.placement === 'Celebrate' || f.placement === 'Gifts').slice(0, 4);
  const celebrateList = selectedCelebrate.length > 0 ? selectedCelebrate : fallbackCelebrate;

  const defaultCelebrateCards = [
    { _id: 'c1', name: 'Solitaire Jewellery', image: { url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80' } },
    { _id: 'c2', name: 'Eternal Sparkle', image: { url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=600&q=80' } },
    { _id: 'c3', name: 'Heart Jewellery', image: { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80' } },
    { _id: 'c4', name: 'Rings', image: { url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80' } },
  ];

  const finalCelebrate = celebrateList.length > 0 ? celebrateList : defaultCelebrateCards;

  // 3. Resolve Category Icons
  const categoryAppearances = (config.categoryAppearances || [])
    .filter((c) => c.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const resolvedCategories = categoryAppearances.map((app) => {
    const cat = categories.find((c) => String(c._id) === String(app.categoryId?._id || app.categoryId));
    return {
      _id: cat?._id || app.categoryId,
      name: app.displayName || cat?.name || 'Jewellery',
      iconUrl: resolveOverride('category', cat?._id, 'icon', app.icon?.url || cat?.icon?.url || ''),
    };
  }).filter((c) => c.name);

  // 4. Sample Products for Showcase
  const sampleProducts = [
    {
      id: 'p1',
      title: 'Aadrika Diamond Stud Earrings',
      category: 'Earrings · 18KT Gold',
      price: '₹ 45,999',
      image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'p2',
      title: 'Elysian Solitaire Drop Earrings',
      category: 'Earrings · 18KT Gold',
      price: '₹ 62,500',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'p3',
      title: 'Mira Floral Diamond Studs',
      category: 'Earrings · 14KT Gold',
      price: '₹ 38,200',
      image: 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'p4',
      title: 'Vanya Heritage Gold Jhumkas',
      category: 'Earrings · 22KT Gold',
      price: '₹ 84,900',
      image: 'https://images.unsplash.com/photo-1611591475816-c9511f568601?auto=format&fit=crop&w=500&q=80',
    },
  ];

  // Button styling generator
  const getButtonClass = () => {
    if (buttonStyle === 'pill') return 'rounded-full';
    if (buttonStyle === 'outline') return 'border-2 bg-transparent';
    return '';
  };

  const buttonInlineStyle = {
    backgroundColor: buttonStyle === 'outline' ? 'transparent' : colors.primary,
    borderColor: colors.primary,
    color: buttonStyle === 'outline' ? colors.primary : '#FFFFFF',
    borderRadius: buttonStyle === 'pill' ? 9999 : `${borderRadius}px`,
  };

  return (
    <div className="space-y-4">
      {/* Top Preview Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Frontend Preview (Live View)</h3>
            <p className="text-xs text-stone-500">
              Interactive preview matching the live storefront · Click any section to edit
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-stone-200 bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => setPreviewMode('desktop')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                previewMode === 'desktop'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <HiOutlineDesktopComputer className="h-4 w-4" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('mobile')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                previewMode === 'mobile'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <HiOutlineDeviceMobile className="h-4 w-4" />
              Mobile (390px)
            </button>
          </div>
        </div>
      </div>

      {/* Preview Frame Wrapper */}
      <div className="rounded-3xl border border-stone-200 bg-stone-200/60 p-4 md:p-8 flex justify-center overflow-x-auto">
        <div
          className={`w-full transition-all duration-300 overflow-hidden shadow-2xl ${
            previewMode === 'mobile' ? 'max-w-[400px] rounded-[36px] border-[8px] border-stone-900' : 'max-w-6xl rounded-2xl border border-stone-300'
          }`}
          style={{
            backgroundColor: colors.background,
            color: colors.text,
            fontFamily: typography.bodyFont || 'Montserrat, sans-serif',
          }}
        >
          {/* 1. STOREFRONT TOP ANNOUNCEMENT BAR */}
          <div className="bg-[#1f1a17] text-[#e0cfba] text-[11px] py-1.5 px-4 flex items-center justify-between border-b border-stone-800/50">
            <div className="flex items-center gap-4 truncate">
              <span className="flex items-center gap-1.5">
                <HiOutlineSparkles className="h-3 w-3 text-amber-400" />
                Virtual Appointment
              </span>
              {previewMode !== 'mobile' && (
                <span className="text-stone-400">|</span>
              )}
              {previewMode !== 'mobile' && (
                <span className="flex items-center gap-1">
                  BIS Hallmarked & Certified Jewellery ✨
                </span>
              )}
            </div>
            <div className="hidden sm:block text-stone-300">
              📞 +91 84600-91955
            </div>
          </div>

          {/* 2. MAIN HEADER & BRAND LOGO */}
          <header className="border-b border-stone-200/80 bg-white/95 px-5 py-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              {/* Logo */}
              <div
                className="cursor-pointer font-serif tracking-[.22em] text-xl md:text-2xl font-bold uppercase transition hover:opacity-85 text-[#221c17]"
                style={{ fontFamily: typography.headingFont || 'Cormorant Garamond, serif' }}
              >
                NEIRAH JEWELLERS
              </div>

              {/* Search Bar (Desktop) */}
              {previewMode !== 'mobile' && (
                <div className="flex-1 max-w-md relative">
                  <input
                    type="text"
                    readOnly
                    placeholder="Search jewellery, diamonds and more..."
                    className="w-full rounded-full border border-stone-200 bg-stone-50 py-1.5 pl-9 pr-4 text-xs text-stone-600 outline-none"
                  />
                  <HiOutlineSearch className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                </div>
              )}

              {/* Header Action Icons */}
              <div className="flex items-center gap-3 text-stone-700">
                <button type="button" className="p-1 hover:text-[#8b6c3a]" title="Wishlist">
                  <HiOutlineHeart className="h-5 w-5" />
                </button>
                <button type="button" className="p-1 hover:text-[#8b6c3a]" title="Account">
                  <HiOutlineUser className="h-5 w-5" />
                </button>
                <button type="button" className="relative p-1 hover:text-[#8b6c3a]" title="Cart">
                  <HiOutlineShoppingBag className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#8b6c3a] text-[10px] font-bold text-white">
                    0
                  </span>
                </button>
              </div>
            </div>

            {/* Navigation Menu */}
            {previewMode !== 'mobile' && (
              <nav className="mt-3 flex items-center justify-center gap-7 border-t border-stone-100 pt-2 text-[11px] font-semibold tracking-wider uppercase text-stone-700">
                <span className="hover:text-[#8b6c3a] cursor-pointer">RINGS ▾</span>
                <span className="hover:text-[#8b6c3a] cursor-pointer">EARRINGS ▾</span>
                <span className="hover:text-[#8b6c3a] cursor-pointer">PENDANT ▾</span>
                <span className="hover:text-[#8b6c3a] cursor-pointer">BANGLES & BRACELETS ▾</span>
                <span className="hover:text-[#8b6c3a] cursor-pointer">SILVER COLLECTION ▾</span>
              </nav>
            )}
          </header>

          {/* 3. HERO BANNER SECTION */}
          <section
            onClick={() => onSelectSection?.('hero')}
            className="group relative cursor-pointer overflow-hidden transition-all duration-200"
            style={{ minHeight: previewMode === 'mobile' ? '380px' : '480px' }}
          >
            {/* Background Image with Dark Luxury Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-102"
              style={{
                backgroundImage: currentHero.imageUrl
                  ? `linear-gradient(90deg, rgba(14,11,9,0.72) 0%, rgba(20,16,13,0.45) 50%, rgba(0,0,0,0.1) 100%), url("${currentHero.imageUrl}")`
                  : `linear-gradient(135deg, ${colors.primary}, #1a1614)`,
              }}
            />

            {/* Content Overlay */}
            <div className="relative z-10 flex h-full min-h-[380px] md:min-h-[480px] flex-col justify-center px-6 md:px-16 text-white max-w-xl">
              {currentHero.subtitle && (
                <p className="text-xs md:text-sm font-semibold tracking-[.25em] uppercase text-amber-200 mb-2 drop-shadow-sm">
                  {currentHero.subtitle}
                </p>
              )}
              <h1
                className="text-3xl md:text-5xl font-normal leading-tight drop-shadow-md"
                style={{ fontFamily: typography.headingFont || 'Cormorant Garamond, serif' }}
              >
                {currentHero.title}
              </h1>
              {currentHero.description && (
                <p className="mt-3 text-xs md:text-sm text-stone-200/90 leading-relaxed max-w-md drop-shadow-sm">
                  {currentHero.description}
                </p>
              )}
              <div className="mt-6">
                <button
                  type="button"
                  style={buttonInlineStyle}
                  className={`inline-block px-7 py-3 text-xs font-bold tracking-[.18em] uppercase transition shadow-lg hover:brightness-110 ${getButtonClass()}`}
                >
                  {currentHero.buttonText}
                </button>
              </div>
            </div>

            {/* Slider arrows & dots */}
            {heroSlides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHeroIdx((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-xs hover:bg-black/60"
                  aria-label="Previous Slide"
                >
                  <HiOutlineChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHeroIdx((prev) => (prev + 1) % heroSlides.length);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-xs hover:bg-black/60"
                  aria-label="Next Slide"
                >
                  <HiOutlineChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {heroSlides.map((_, idx) => (
                    <span
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveHeroIdx(idx);
                      }}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        activeHeroIdx === idx ? 'w-6 bg-white' : 'w-2 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Section Tag */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition rounded-full bg-black/75 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-xs flex items-center gap-1 shadow-md">
              <HiOutlineSparkles className="h-3.5 w-3.5 text-amber-400" />
              Click to edit Hero Banner
            </div>
          </section>

          {/* 4. CATEGORY ICONS STRIP (Optional if configured) */}
          {resolvedCategories.length > 0 && (
            <section
              onClick={() => onSelectSection?.('categories')}
              className="group cursor-pointer border-b border-stone-200/60 bg-white/60 py-6 px-4 relative"
            >
              <div className="mx-auto flex flex-wrap justify-center gap-6 md:gap-10">
                {resolvedCategories.slice(0, 8).map((cat, idx) => (
                  <div key={cat._id || idx} className="flex flex-col items-center gap-2 text-center group/cat">
                    <div className="h-16 w-16 rounded-full border border-stone-200 bg-[#faf6f0] p-1.5 shadow-xs transition group-hover/cat:scale-105 group-hover/cat:border-[#8b6c3a]">
                      {cat.iconUrl ? (
                        <img src={cat.iconUrl} alt={cat.name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-stone-100 text-[#8b6c3a]">
                          <IoDiamondOutline className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-stone-800 tracking-wide">{cat.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. CELEBRATE & GIFTS SECTION ("Gifts That Say A Lot") */}
          <section
            onClick={() => onSelectSection?.('celebrate')}
            className="group relative cursor-pointer px-5 md:px-12 py-10 md:py-14"
          >
            <div className="text-center mb-8">
              <h2
                className="text-2xl md:text-3xl font-normal text-stone-900 tracking-wide"
                style={{ fontFamily: typography.headingFont || 'Cormorant Garamond, serif' }}
              >
                Gifts That Say A Lot
              </h2>
              <div className="mt-1 h-0.5 w-12 bg-[#8b6c3a] mx-auto opacity-70" />
            </div>

            <div className={`grid gap-4 ${previewMode === 'mobile' ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
              {finalCelebrate.slice(0, 4).map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="group/card relative overflow-hidden rounded-2xl bg-stone-900 shadow-md transition hover:-translate-y-1"
                >
                  <div className="aspect-4/5 overflow-hidden">
                    <img
                      src={item.image?.url || 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80'}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105 opacity-90"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                    <span
                      className="text-sm md:text-base font-semibold text-white tracking-wide"
                      style={{ fontFamily: typography.headingFont || 'Cormorant Garamond, serif' }}
                    >
                      {item.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition rounded-full bg-black/75 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-xs flex items-center gap-1 shadow-md">
              <HiOutlineSparkles className="h-3.5 w-3.5 text-amber-400" />
              Click to edit Celebrate & Gifts
            </div>
          </section>

          {/* 6. PRODUCT SHOWCASE ("Most Loved on Neirah") */}
          <section
            onClick={() => onSelectSection?.('products')}
            className="group relative cursor-pointer px-5 md:px-12 py-10 bg-white/80 border-t border-stone-200/50"
          >
            <div className="text-center mb-8">
              <h2
                className="text-2xl md:text-3xl font-normal text-stone-900 tracking-wide"
                style={{ fontFamily: typography.headingFont || 'Cormorant Garamond, serif' }}
              >
                Most Loved on Neirah
              </h2>
              <div className="mt-1 h-0.5 w-12 bg-[#8b6c3a] mx-auto opacity-70" />
            </div>

            <div className={`grid gap-4 ${previewMode === 'mobile' ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
              {sampleProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-2xl border border-stone-200/70 bg-white p-3 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  style={{ borderRadius: `${borderRadius}px` }}
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-50 mb-3">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-stone-400 hover:text-red-500 shadow-xs"
                    >
                      <HiOutlineHeart className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">{prod.category}</p>
                    <h4 className="text-xs font-semibold text-stone-900 line-clamp-1 mt-0.5">{prod.title}</h4>
                    <p className="mt-2 text-sm font-bold text-[#8b6c3a]">{prod.price}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition rounded-full bg-black/75 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-xs flex items-center gap-1 shadow-md">
              <HiOutlineSparkles className="h-3.5 w-3.5 text-amber-400" />
              Click to edit Product Showcase
            </div>
          </section>

          {/* 7. FOOTER / STOREFRONT BOTTOM */}
          <footer className="bg-[#191512] text-stone-300 px-6 py-8 text-center text-xs space-y-2">
            <p className="font-serif tracking-widest text-base text-amber-100 uppercase" style={{ fontFamily: typography.headingFont || 'Cormorant Garamond, serif' }}>
              NEIRAH JEWELLERS
            </p>
            <p className="text-stone-400 max-w-md mx-auto text-[11px]">
              Timeless elegance crafted in certified gold and conflict-free solitaire diamonds.
            </p>
            <p className="text-[10px] text-stone-500 pt-3 border-t border-stone-800">
              © {new Date().getFullYear()} Neirah Jewellers. All Rights Reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

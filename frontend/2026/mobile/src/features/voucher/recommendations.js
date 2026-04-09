/**
 * @module recommendations
 * Product recommendation data for the voucher carousel + "find out more" links.
 * Extracted from mobile's voucher.js and find-out-more.js.
 * Pure data — no logic, no DOM.
 */

// ── UK Product Catalogues (by recommendation) ──────────────────────

export const recommendations = {
  Bloom: [
    { name: 'Bloom Lotion',  type: 'Tone',       image: 'bloom_lotion.jpg',       price: '\u00A342', url: 'http://uk.azadi.com/bloom-lotion,83,1,29786,433798.htm#s=62149' },
    { name: 'Bloom Extract', type: 'Treat',      image: 'bloom_extract.jpg',      price: '\u00A376', url: 'http://uk.azadi.com/bloom-extract,83,1,29786,271943.htm#s=62149' },
    { name: 'Bloom Oil',     type: 'Repair',     image: 'bloom_youth_oil.jpg',    price: '\u00A372', url: 'http://uk.azadi.com/bloom-youth-oil,83,1,29786,604957.htm#s=62149' },
    { name: 'Bloom Eyes',    type: 'Treat',      image: 'bloom_bloom_eyes.jpg', price: '\u00A349', url: 'http://uk.azadi.com/bloom-bloom-eyes,83,1,29786,271944.htm#s=62149' },
    { name: 'Bloom Cream',   type: 'Moisturise', image: 'bloom_cream.jpg',        price: '\u00A374', url: 'http://uk.azadi.com/bloom-cream,83,1,29786,320140.htm#s=62149' },
  ],

  Glow: [
    { name: 'Perfecting Mist',        type: 'Tone',       image: 'glow_sublime_perfecting_mist.jpg',    price: '\u00A314', url: 'http://uk.azadi.com/glow-sublime-perfecting-mist,83,1,66855,702649.htm#s=66856' },
    { name: 'Perfecting Essence',     type: 'Treat',      image: 'glow_sublime_perfecting_essence.jpg', price: '\u00A338', url: 'http://uk.azadi.com/glow-sublime-perfecting-essence,83,1,66855,702657.htm#s=66856' },
    { name: 'Full Size Moisturiser',  type: 'Moisturise', image: 'glow_sublime_perfecting_cream.jpg',   price: '\u00A332', url: 'http://uk.azadi.com/glow-sublime-perfecting-cream,83,1,67060,702652.htm#s=66856' },
  ],

  Rise: [
    { name: 'Cleansing Foam',         type: 'Cleanse',    image: 'rise_cleansing_foam.jpg',    price: '\u00A319', url: 'http://uk.azadi.com/rise-cleansing-foam,83,1,29786,270004.htm#s=62152' },
    { name: 'Essential Water',        type: 'Tone',       image: 'essential_face_water.jpg',       price: '\u00A318', url: 'http://uk.azadi.com/essential-face-water,83,1,29786,269940.htm#s=62152' },
    { name: 'Rise Serum',         type: 'Treat',      image: 'bloom_rise_serum.jpg',  price: '\u00A349', url: 'http://uk.azadi.com/bloom-rise-serum,83,1,29786,798985.htm' },
    { name: 'Eye Balm',              type: 'Treat',      image: 'rise_eye_balm.jpg',          price: '\u00A332', url: 'http://uk.azadi.com/rise-eye-balm,83,1,29786,270013.htm#s=62152' },
    { name: 'Full Size Moisturiser',  type: 'Moisturise', image: 'rise_cream.jpg',             price: '\u00A346', url: 'http://uk.azadi.com/rise-cream,83,1,29786,269737.htm#s=62152' },
  ],

  Silk: [
    { name: 'Silk Cleansing Oil',     type: 'Cleanse',    image: 'silk_cleansing_oil.jpg',         price: '\u00A317', url: 'http://uk.azadi.com/silk-cleansing-oil,83,1,29776,649983.htm#s=29953' },
    { name: 'Silk Toner',            type: 'Treat',      image: 'silk_gentle_toner.jpg',          price: '\u00A315', url: 'http://uk.azadi.com/silk-gentle-toner,83,1,29776,649982.htm#s=29953' },
    { name: 'Full Size Moisturiser',  type: 'Moisturise', image: 'silk_light_comforting_cream.jpg', price: '\u00A326', url: 'http://uk.azadi.com/silk-light-comforting-cream,83,1,29776,649980.htm#s=29953' },
  ],
};

// ── Ireland Pricing Overrides ───────────────────────────────────────

export const ieOverrides = {
  Bloom:   [{ url: 'http://ie.azadi.com/bloom-lotion,103,1,47815,440145.htm', price: '\u20AC49' }, { url: 'http://ie.azadi.com/bloom-extract,103,1,47815,440123.htm', price: '\u20AC90' }, { url: 'http://ie.azadi.com/bloom-youth-oil,103,1,47815,618320.htm', price: '\u20AC84' }, { url: 'http://ie.azadi.com/bloom-bloom-eyes,103,1,47815,440129.htm', price: '\u20AC58' }, { url: 'http://ie.azadi.com/bloom-cream,103,1,47815,440134.htm', price: '\u20AC88' }],
  Glow:    [{ url: 'http://ie.azadi.com/glow-sublime-perfecting-mist,103,1,66858,702901.htm', price: '\u20AC17' }, { url: 'http://ie.azadi.com/glow-sublime-perfecting-essence,103,1,66858,702909.htm', price: '\u20AC46' }, { url: 'http://ie.azadi.com/glow-sublime-perfecting-cream,103,1,67061,702904.htm', price: '\u20AC37' }],
  Rise:    [{ url: 'http://ie.azadi.com/rise-cleansing-foam,103,1,47815,440116.htm', price: '\u20AC23' }, { url: 'http://ie.azadi.com/essential-face-water,103,1,47815,457540.htm', price: '\u20AC21' }, { url: 'http://ie.azadi.com/rise-serum,103,1,47815,799092.htm', price: '\u20AC58' }, { url: 'http://ie.azadi.com/rise-eye-balm,103,1,47815,440119.htm', price: '\u20AC37' }, { url: 'http://ie.azadi.com/rise-cream,103,1,47815,440112.htm', price: '\u20AC54' }],
  Silk:    [{ url: 'http://ie.azadi.com/silk-gentle-toner,103,1,47808,649988.htm', price: '\u20AC20' }, { url: 'http://ie.azadi.com/silk-gentle-toner,103,1,47808,649988.htm', price: '\u20AC18' }, { url: 'http://ie.azadi.com/silk-light-comforting-cream,103,1,47808,649986.htm', price: '\u20AC32' }],
};

// ── "Find Out More" Destination Links ───────────────────────────────

/**
 * Override recommendations with products from the backend API.
 * @param {Object} backendProducts — keyed by brand (e.g. { Bloom: [...], Glow: [...] })
 */
export function applyBackendProducts(backendProducts) {
  if (!backendProducts) return;
  for (const [brand, items] of Object.entries(backendProducts)) {
    if (Array.isArray(items) && items.length > 0) {
      recommendations[brand] = items;
    }
  }
  console.log('[Recommendations] Backend products applied:', Object.keys(backendProducts).join(', '));
}

export const findOutMoreLinks = {
  uk: { bloom: 'http://uk.azadi.com/bloom,83,1,73761,803118.htm', glow: 'http://uk.azadi.com/glow,83,1,73761,803205.htm', rise: 'http://uk.azadi.com/rise,83,1,73761,803204.htm', silk: 'http://uk.azadi.com/silk,83,1,73761,803206.htm' },
  ie: { bloom: 'http://ie.azadi.com/bloom,103,1,73764,803212.htm', glow: 'http://ie.azadi.com/glow,103,1,73764,803214.htm', rise: 'http://ie.azadi.com/rise,103,1,73764,803213.htm', silk: 'http://ie.azadi.com/silk,103,1,73764,803216.htm' },
};

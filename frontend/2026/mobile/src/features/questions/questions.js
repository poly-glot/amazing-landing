/**
 * @module questions
 * Quiz question sets, product recommendation logic, and priority rankings.
 * Ported from mobile's azadi-question-map.js — all jQuery utilities
 * replaced with native equivalents.
 */

// ── Helpers ─────────────────────────────────────────────────────────

function label(main, sub) {
  return `<div class="question-value">${main}</div>`
       + `<div class="question-label"><div class="question-label-inner">(${sub})</div></div>`;
}

function expandAges(base, ages) {
  return Object.fromEntries(ages.map((a) => [a, base]));
}

const OLDER_AGES = ['35-45', '45-55', '55+', "That's my secret"];
const ALL_AGES   = ['Under 25', '25-35', ...OLDER_AGES];

// ── Step 1: Age ─────────────────────────────────────────────────────

const AGE_OPTIONS = {
  'question-item-container-3':  'Under 25',
  'question-item-container-6':  '25-35',
  'question-item-container-4':  '35-45',
  'question-item-container-9':  '45-55',
  'question-item-container-7':  '55+',
  'question-item-container-10': "That's my secret",
};

// ── Step 2: Skin ────────────────────────────────────────────────────

const SKIN_YOUNG = {
  'question-item-container-4': label('Dry', 'lacks moisture & comfort'),
  'question-item-container-6': label('Normal', 'oily/oily in certain areas/not dry'),
  'question-item-container-7': label('Oily/Combination', 'shiny all over with visible pores'),
};

const SKIN_MATURE = {
  ...SKIN_YOUNG,
  'question-item-container-9': label('Mature', 'signs of ageing'),
};

const SKIN_BY_AGE = {
  ...expandAges(SKIN_YOUNG, ['Under 25', '25-35']),
  ...expandAges(SKIN_MATURE, OLDER_AGES),
};

// ── Step 3: Concerns ────────────────────────────────────────────────

const CONCERN_UNDER25 = {
  'question-item-container-1':  'Dark spots/Uneven skin tone',
  'question-item-container-4':  'Visible pores and blemishes',
  'question-item-container-7':  'Dullness/Lack of radiance',
  'question-item-container-6':  'Delicate with dry or red patches',
  'question-item-container-9':  'Comfort and nourishment',
  'question-item-container-11': 'Sensitivity',
  'question-item-container-12': 'Oil control',
};

const CONCERN_25_35 = {
  'question-item-container-1':  'Dark spots/Uneven skin tone',
  'question-item-container-2':  'Visible pores and blemishes',
  'question-item-container-3':  'Dullness/Lack of radiance',
  'question-item-container-4':  'Delicate with dry or red patches',
  'question-item-container-5':  'Comfort and nourishment',
  'question-item-container-6':  'Sensitivity',
  'question-item-container-7':  'Fine lines and wrinkles',
  'question-item-container-8':  'Early signs of ageing',
  'question-item-container-9':  'Loss of firmness and elasticity',
  'question-item-container-10': 'Oil control',
};

const CONCERN_OVER35 = {
  ...CONCERN_25_35,
  'question-item-container-8': 'Visible lines and deep wrinkles',
};

const CONCERN_BY_AGE = {
  'Under 25': CONCERN_UNDER25,
  '25-35':    CONCERN_25_35,
  ...expandAges(CONCERN_OVER35, OLDER_AGES),
};

// ── Product Recommendation Matrix ───────────────────────────────────

const PRODUCTS_UNDER25 = {
  'Dark spots/Uneven skin tone':       'Glow',
  'Visible pores and blemishes':       'Glow',
  'Dullness/Lack of radiance':         'Glow',
  'Delicate with dry or red patches':  'Silk',
  'Comfort and nourishment':           'Silk',
  'Sensitivity':                       'Silk',
  'Oil control':                       'Glow',
};

const PRODUCTS_25_35 = {
  ...PRODUCTS_UNDER25,
  'Fine lines and wrinkles':         'Rise',
  'Early signs of ageing':           'Rise',
  'Loss of firmness and elasticity': 'Rise',
};

const PRODUCTS_OVER35 = {
  'Dark spots/Uneven skin tone':       'Bloom',
  'Visible pores and blemishes':       'Glow',
  'Dullness/Lack of radiance':         'Bloom',
  'Delicate with dry or red patches':  'Silk',
  'Comfort and nourishment':           'Bloom',
  'Sensitivity':                       'Bloom',
  'Fine lines and wrinkles':           'Rise',
  'Visible lines and deep wrinkles':   'Bloom',
  'Loss of firmness and elasticity':   'Bloom',
  'Oil control':                       'Glow',
};

const PRODUCT_BY_AGE = {
  'Under 25': PRODUCTS_UNDER25,
  '25-35':    PRODUCTS_25_35,
  ...expandAges(PRODUCTS_OVER35, OLDER_AGES),
};

// ── Priority Tiebreaker ─────────────────────────────────────────────

const PRIORITY = {
  'Under 25': ['Glow', 'Silk'],
  '25-35':    ['Rise', 'Glow', 'Silk'],
  ...expandAges(['Bloom', 'Rise', 'Glow', 'Silk'], OLDER_AGES),
};

// ── Public API ──────────────────────────────────────────────────────

/** @returns {Object<string, string>} CSS-class -> label */
export function getAge()           { return AGE_OPTIONS; }

/** @param {string} age */
export function getSkin(age)       { return SKIN_BY_AGE[age]    ?? null; }

/** @param {string} age */
export function getConcerns(age)   { return CONCERN_BY_AGE[age] ?? null; }

/**
 * Determine the recommended product from age + selected concerns.
 * @param {string} age
 * @param {string|string[]} concerns
 * @returns {string|null} Product name (Bloom, Glow, Rise, Silk).
 */
export function getProduct(age, concerns) {
  const map = _backendMapping[age] ?? PRODUCT_BY_AGE[age];
  if (!map) return null;

  const list     = typeof concerns === 'string' ? [concerns] : concerns;
  const possible = [...new Set(list.map((c) => map[c]).filter(Boolean))];

  if (possible.length <= 1) return possible[0] ?? null;

  const priority = _backendPriority[age] ?? PRIORITY[age] ?? [];
  return priority.find((p) => possible.includes(p)) ?? possible[0];
}

// ── Backend Override ────────────────────────────────────────────────

let _backendMapping  = {};
let _backendPriority = {};

export function applyBackendConfig(config) {
  if (config?.productMapping) {
    _backendMapping = config.productMapping;
    console.log('[Questions] Backend mapping applied:', Object.keys(config.productMapping).join(', '));
  }
  if (config?.priority) _backendPriority = config.priority;
}

export const questionsMap = { getAge, getSkin, getConcerns, getProduct, applyBackendConfig };

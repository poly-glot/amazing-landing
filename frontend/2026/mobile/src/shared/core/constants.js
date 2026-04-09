/**
 * @module constants
 * Shared design tokens for the Azadi mobile experience.
 */

// ── Brand Product Maps ──────────────────────────────────────────────

export const PRODUCTS = ['Bloom', 'Glow', 'Rise', 'Silk'];

export const PRODUCT_BG_MAP = {
  Bloom:   'bg-yellow',
  Glow:    'bg-red',
  Rise:    'bg-blue',
  Silk:    'bg-sky',
};

export const PRODUCT_LOGO_COLOR = {
  Bloom:   'text-blue',
  Glow:    'text-white',
  Rise:    'text-white',
  Silk:    'text-blue',
};

// Mobile uses text-white variant for some products
export const PRODUCT_TEXT_CLASS = {
  Bloom:   '',
  Glow:    'text-white',
  Rise:    'text-white',
  Silk:    'text-white',
};

// ── Animation Tokens ────────────────────────────────────────────────

export const EASING = {
  EASE_OUT:       [0.0, 0.0, 0.58, 1.0],
  EASE_OUT_SINE:  'easeOutSine',
};

export const DURATION = {
  FADE:       300,
  TRANSITION: 400,
};

// ── Runtime Config (read from inline <script> globals) ──────────────

export const BASE_URL       = window.baseurl             ?? '/mobile/';
export const BASE_HOST      = window.basehost             ?? '';
export const API_BASE       = window.baseurl_api          ?? '/';
export const PROMOTION_SLUG = window.main_promotion_slug  ?? 'default';
export const PDF_LINK       = window.pdf_link             ?? '#';
export const TRACKING_URL   = window.tracking_url         ?? '/mobile/default/';

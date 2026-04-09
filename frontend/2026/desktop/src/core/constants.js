/**
 * @module constants
 * Shared design tokens for the Azadi desktop experience.
 *
 * Layout: Brand maps at the top (read first when adding a product),
 * animation tokens below (read when tuning motion), config last.
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

// ── Animation Tokens ────────────────────────────────────────────────

export const EASING = {
  EASE_OUT:       [0.0, 0.0, 0.58, 1.0],
  EASE_OUT_SINE:  'easeOutSine',
  PRODUCT_REVEAL: [0.0, 0.56, 0.5, 0.995],
  QUESTION_BOUNCE:[0.175, 0.885, 0.32, 1.275],
};

export const DURATION = {
  LANDING:    300,
  TRANSITION: 750,
  INDICATOR:  1000,
  QUESTIONS:  1000,
  RESULTS:    300,
  VOUCHER:    300,
};

/** @deprecated Use DURATION + EASING directly. Kept for downstream imports. */
export const ANIMATION = {
  LANDING_DURATION:         DURATION.LANDING,
  PAGE_TRANSITION_DURATION: DURATION.TRANSITION,
  INDICATOR_DURATION:       DURATION.INDICATOR,
  QUESTIONS_DURATION:       DURATION.QUESTIONS,
  RESULTS_DURATION:         DURATION.RESULTS,
  VOUCHER_DURATION:         DURATION.VOUCHER,
  EASING,
};

// ── Runtime Config (read from inline <script> globals) ──────────────

export const BASE_URL       = window.baseurl             ?? '/desktop/';
export const BASE_HOST      = window.basehost             ?? '';
export const API_BASE       = window.baseurl_api          ?? '/';
export const PROMOTION_SLUG = window.main_promotion_slug  ?? 'default';
export const PDF_LINK       = window.pdf_link             ?? '#';
export const TRACKING_URL   = window.tracking_url         ?? '/desktop/default/';

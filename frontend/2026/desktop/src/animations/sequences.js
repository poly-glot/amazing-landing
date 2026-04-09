/**
 * @module sequences
 * Named animation sequences using Web Animations API.
 * Zero jQuery / Velocity.js dependency.
 */

import { DURATION, EASING } from '../core/constants.js';
import { animate, runSequence } from '../core/animate.js';

// ── Landing: Strips ─────────────────────────────────────────────────

export function animateStrips(stripes, initialX, onLastStrip) {
  if (stripes.length === 0) return;

  const step = () => {
    if (stripes.length === 0) return;
    if (stripes.length === 1) onLastStrip?.();

    const el = stripes.shift();
    el.classList.add('animating');

    animate(el,
      { translateZ: 0, translateX: [0, initialX] },
      { visibility: 'visible', duration: DURATION.LANDING, easing: EASING.EASE_OUT,
        complete() { el.classList.remove('animating'); step(); } },
    );
  };

  step();
}

// ── Landing: Products ───────────────────────────────────────────────

export function animateProducts(products, backgrounds, onLast) {
  if (products.length === 0) return;

  const step = () => {
    if (products.length === 0) return;
    if (products.length === 1) onLast?.();

    const product = products.shift();
    const bg      = backgrounds.shift();

    if (bg) {
      animate(bg,
        { opacity: [0.4, 0], right: [bg.dataset.initialRight ?? '-20%', '-50%'] },
        { visibility: 'visible', duration: DURATION.LANDING + 150 },
      );
    }

    animate(product,
      { opacity: [1, 0], scaleX: [1, 0], scaleY: [1, 0], blur: [0, 10] },
      { visibility: 'visible', duration: DURATION.LANDING, easing: EASING.PRODUCT_REVEAL },
    ).then(step);
  };

  step();
}

// ── Landing: Taglines + Logo ────────────────────────────────────────

export function animateTaglines(logo, introduction, ctaText, onComplete) {
  const dur = DURATION.LANDING * 2.5;

  animate(logo,
    { opacity: [1, 0] },
    { visibility: 'visible', duration: dur, easing: EASING.PRODUCT_REVEAL });

  animate(introduction,
    { opacity: [1, 0], blur: [0, 10], translateY: [0, -500] },
    { visibility: 'visible', duration: dur, easing: EASING.PRODUCT_REVEAL });

  animate(ctaText,
    { opacity: [1, 0], blur: [0, 10], translateY: [0, 200] },
    { visibility: 'visible', duration: dur, easing: EASING.PRODUCT_REVEAL },
  ).then(onComplete);
}

// ── Landing: CTA Button ─────────────────────────────────────────────

export function animateCTA(ctaButton, legalLinks) {
  animate(ctaButton,
    { opacity: [1, 0], blur: [0, 10], scaleX: [1, 0], scaleY: [1, 0] },
    { visibility: 'visible', duration: DURATION.LANDING, easing: EASING.EASE_OUT_SINE });

  animate(legalLinks,
    { opacity: [1, 0] },
    { visibility: 'visible', duration: DURATION.LANDING, easing: EASING.EASE_OUT_SINE });
}

// ── Results: Product Reveal ─────────────────────────────────────────

export function buildResultsReveal(title, description, image, formContainer) {
  return [
    step(title,         { opacity: [1, 0], translateY: [0, -20], translateZ: 0 }, 300),
    step(description,   { opacity: [1, 0], translateY: [0, 20],  translateZ: 0 }, 300),
    step(image,         { opacity: [1, 0], scaleX: [1, 0.4], scaleY: [1, 0.4], blur: [0, 5], translateZ: 0 }, 300),
    step(formContainer, { opacity: [1, 0] }, 150, {
      complete: () => document.querySelector('.background-video')?.remove(),
    }),
  ];
}

// ── Voucher: Header + Body Reveal ───────────────────────────────────

export function buildVoucherReveal(header, body, onBodyComplete) {
  return [
    step(header, { opacity: [1, 0], translateY: [0, -200], translateZ: 0 }, 300),
    step(document.querySelector('.indicator'), { opacity: [0, 1], translateY: [0, -20], translateZ: 0 }, 300),
    step(body, { opacity: [1, 0], translateZ: 0 }, 300, { complete: onBodyComplete }),
  ];
}

// ── Shared ──────────────────────────────────────────────────────────

function step(elements, properties, duration, extra = {}) {
  return { elements, properties, options: { visibility: 'visible', duration, easing: EASING.EASE_OUT_SINE, ...extra } };
}

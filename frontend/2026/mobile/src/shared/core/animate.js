/**
 * @module animate
 * Web Animations API utility — drop-in replacement for Velocity.js patterns.
 *
 * Handles:
 *   - Velocity's [endVal, startVal] force-feeding → WAAPI keyframe pairs
 *   - blur filter animation (Velocity's `blur` shorthand)
 *   - transform property decomposition (translateX/Y/Z, scaleX/Y, scale, rotateZ)
 *   - visibility toggling (Velocity's `visibility` option)
 *   - display toggling (Velocity's `display` option)
 *   - delay support
 *   - RunSequence replacement via `runSequence()`
 */

// ── Easing Map ──────────────────────────────────────────────────────
// Velocity name → CSS cubic-bezier or keyword

const EASING_MAP = {
  'ease-in':        'ease-in',
  'ease-out':       'ease-out',
  'ease-in-out':    'ease-in-out',
  'easeOutSine':    'cubic-bezier(0.39, 0.575, 0.565, 1)',
  'easeInQuint':    'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
};

function resolveEasing(e) {
  if (!e) return 'ease';
  if (typeof e === 'string') return EASING_MAP[e] ?? e;
  if (Array.isArray(e)) return `cubic-bezier(${e.join(', ')})`;
  return 'ease';
}

// ── Transform properties that Velocity treats as top-level ──────────

const TRANSFORM_KEYS = new Set([
  'translateX', 'translateY', 'translateZ',
  'scaleX', 'scaleY', 'scale',
  'rotateZ',
]);

const TRANSFORM_UNITS = {
  translateX: 'px', translateY: 'px', translateZ: 'px',
  scaleX: '', scaleY: '', scale: '',
  rotateZ: 'deg',
};

const TRANSFORM_DEFAULTS = {
  translateX: 0, translateY: 0, translateZ: 0,
  scaleX: 1, scaleY: 1, scale: 1,
  rotateZ: 0,
};

// ── Public API ──────────────────────────────────────────────────────

/**
 * Animate a single element with Velocity-compatible property syntax.
 *
 * @param {Element} el
 * @param {Object}  props   Velocity-style properties. Values can be:
 *                          - number: end value (start from current)
 *                          - [end, start]: force-fed pair
 * @param {Object}  [opts]  { duration, easing, delay, visibility, display, complete, begin }
 * @returns {Promise<void>} Resolves when animation finishes.
 */
export function animate(el, props, opts = {}) {
  if (!el) return Promise.resolve();

  const {
    duration = 400,
    easing,
    delay = 0,
    visibility,
    display,
    complete,
    begin,
  } = opts;

  // Decompose Velocity props into WAAPI keyframes
  const from = {};
  const to   = {};
  decompose(props, from, to);

  // Ensure both keyframes have identical transform function lists.
  // WAAPI cannot interpolate mismatched transform strings.
  for (const key of TRANSFORM_KEYS) {
    if (from[key] === undefined && to[key] !== undefined) from[key] = TRANSFORM_DEFAULTS[key];
    if (to[key] === undefined && from[key] !== undefined) to[key] = TRANSFORM_DEFAULTS[key];
  }
  if (from.blur === undefined && to.blur !== undefined) from.blur = 0;
  if (to.blur === undefined && from.blur !== undefined) to.blur = 0;

  // Build the two keyframe objects
  const kfFrom = buildKeyframe(from);
  const kfTo   = buildKeyframe(to);

  // Guard: if both keyframes are empty (e.g. translateZ: 0 only), skip animation
  if (Object.keys(kfFrom).length === 0 && Object.keys(kfTo).length === 0) {
    if (visibility === 'visible') el.style.visibility = 'visible';
    begin?.();
    complete?.();
    return Promise.resolve();
  }

  // Use WAAPI's native delay + fill:'both' so the FROM keyframe renders
  // during the delay period (element stays hidden in its initial state
  // until the delay elapses, then the animation plays).
  // Visibility is deferred to when the animation actually starts.
  if (delay > 0) {
    // Set visibility after delay via a zero-duration animation trick:
    // schedule a tiny callback to flip visibility right when delay ends.
    const visTimer = setTimeout(() => {
      if (visibility === 'visible') el.style.visibility = 'visible';
      applyKeyframe(el, kfFrom);
    }, delay);

    const animation = el.animate([kfFrom, kfTo], {
      duration,
      delay,
      easing: resolveEasing(easing),
      fill: 'forwards',
    });

    begin?.();

    const settle = () => {
      clearTimeout(visTimer);
      applyKeyframe(el, kfTo);
      try { animation.cancel(); } catch { /* already finished */ }
      if (visibility === 'hidden') el.style.visibility = 'hidden';
      if (display === 'none')  el.style.display = 'none';
      if (display === 'block') el.style.display = 'block';
      complete?.();
    };

    return animation.finished.then(settle).catch(settle);
  }

  // No delay — set initial state immediately
  if (visibility === 'visible') el.style.visibility = 'visible';
  applyKeyframe(el, kfFrom);

  begin?.();

  const animation = el.animate([kfFrom, kfTo], {
    duration,
    easing: resolveEasing(easing),
    fill: 'forwards',
  });

  const settle = () => {
    applyKeyframe(el, kfTo);
    try { animation.cancel(); } catch { /* already finished */ }

    if (visibility === 'hidden') el.style.visibility = 'hidden';
    if (display === 'none')  el.style.display = 'none';
    if (display === 'block') el.style.display = 'block';

    complete?.();
  };

  return animation.finished.then(settle).catch(settle);
}

/**
 * Run an array of animation steps sequentially (replaces $.Velocity.RunSequence).
 *
 * @param {Array<{elements, properties, options}>} steps
 * @returns {Promise<void>}
 */
export async function runSequence(steps) {
  for (const { elements, properties, options } of steps) {
    const el = resolveElement(elements);
    if (el) await animate(el, properties, options);
  }
}

// ── Internal: Property Decomposition ────────────────────────────────

function decompose(props, from, to) {
  for (const [key, val] of Object.entries(props)) {
    decomposeForced(val, key, from, to);
  }
}

function decomposeForced(val, key, from, to) {
  if (Array.isArray(val)) {
    to[key]   = val[0];
    from[key] = val[1];
  } else {
    to[key]   = val;
    from[key] = undefined; // inherit current
  }
}

// ── Internal: Keyframe Builder ──────────────────────────────────────

function buildKeyframe(raw) {
  const kf = {};
  const transforms = [];

  for (const [key, val] of Object.entries(raw)) {
    if (val === undefined) continue;

    if (key === 'blur') {
      kf.filter = `blur(${val}px)`;
    } else if (key === 'opacity') {
      kf.opacity = val;
    } else if (key === 'top') {
      kf.top = typeof val === 'number' ? `${val}px` : val;
    } else if (key === 'right') {
      kf.right = typeof val === 'number' ? `${val}px` : val;
    } else if (TRANSFORM_KEYS.has(key)) {
      const unit = TRANSFORM_UNITS[key];
      const fn   = key === 'scale' ? 'scale' : key;
      transforms.push(`${fn}(${val}${unit})`);
    }
  }

  if (transforms.length > 0) {
    kf.transform = transforms.join(' ');
  }

  return kf;
}

// ── Internal: Apply keyframe to inline styles ───────────────────────

function applyKeyframe(el, kf) {
  if (kf.opacity !== undefined) el.style.opacity = kf.opacity === 1 ? '' : kf.opacity;
  // Clear filter when blur is 0 — avoids unnecessary GPU compositing layer
  if (kf.filter)                el.style.filter = kf.filter === 'blur(0px)' ? '' : kf.filter;
  if (kf.transform)             el.style.transform = kf.transform;
  if (kf.top)                   el.style.top = kf.top;
  if (kf.right)                 el.style.right = kf.right;
}

// ── Internal: Resolve element from various input types ──────────────

function resolveElement(el) {
  if (!el) return null;
  if (el instanceof Element) return el;
  if (el.length !== undefined) return el[0] ?? null; // NodeList, array, jQuery
  return null;
}

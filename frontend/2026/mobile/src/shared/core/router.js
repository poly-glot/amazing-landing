/**
 * @module router
 * Simple page router for mobile — shows/hides page divs with slide transitions.
 * Pages are identified by their IDs: page-landing, page-questions-age, etc.
 */

import { qs } from './dom.js';
import { animate } from './animate.js';

const TRANSITION_MS = 350;
const controllers = {};
let currentPageEl = null;
let transitioning = false;

export function register(name, controller) {
  controllers[name] = controller;
}

/** Show the landing page (first visible page). */
export function init() {
  currentPageEl = qs('#page-landing');
  if (currentPageEl) currentPageEl.classList.remove('hidden');
}

/**
 * Navigate to a named page with a slide transition.
 */
export function go(name) {
  if (transitioning) return;

  const target = qs(`#page-${name}`) ?? qs(`#page-questions-${name}`);
  if (!target || target === currentPageEl) return;

  const leaving = currentPageEl;
  currentPageEl = target;

  // Prepare target off-screen to the right
  target.classList.remove('hidden');
  target.style.position = 'absolute';
  target.style.top = '0';
  target.style.left = '0';
  target.style.width = '100%';
  target.style.transform = 'translateX(100%)';
  target.style.opacity = '1';

  transitioning = true;

  // Slide leaving page out to the left, slide target in from the right
  const slideOut = leaving
    ? animate(leaving,
        { translateX: [-window.innerWidth, 0], opacity: [0.5, 1] },
        { duration: TRANSITION_MS, easing: 'ease-out' })
    : Promise.resolve();

  const slideIn = animate(target,
    { translateX: [0, window.innerWidth] },
    { duration: TRANSITION_MS, easing: 'ease-out' });

  Promise.all([slideOut, slideIn]).then(() => {
    // Clean up leaving page
    if (leaving) {
      leaving.classList.add('hidden');
      leaving.style.transform = '';
      leaving.style.opacity = '';
      leaving.style.position = '';
    }

    // Clean up target page
    target.style.position = '';
    target.style.top = '';
    target.style.left = '';
    target.style.width = '';
    target.style.transform = '';
    target.scrollTop = 0;

    transitioning = false;

    // Invoke controller hooks
    const ctrl = controllers[name];
    ctrl?.init?.();
    ctrl?.animate?.();
  });
}

export function next(name) { go(name); }

export const router = { register, init, go, next };

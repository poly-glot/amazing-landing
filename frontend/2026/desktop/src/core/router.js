/**
 * @module router
 * Page router — cross-fade transitions between pages via WAAPI.
 */

import { DURATION, EASING } from './constants.js';
import { qsa, delegate } from './dom.js';
import { animate } from './animate.js';

const controllers = {};
let currentPage = null;

export function register(name, controller) { controllers[name] = controller; }

export function init() {
  const pages = qsa('.pages-container .page');
  currentPage = pages.find((p) => p.classList.contains('page-current')) ?? pages[0];

  delegate(document, 'click', '[data-next]', (e, link) => {
    e.preventDefault();
    animate(link, { opacity: [0, 1] }, { visibility: 'visible', duration: DURATION.TRANSITION, easing: 'ease-in' });
    go(link.dataset.next);
  });
}

export function go(name) {
  const current = currentPage;
  const next    = current.nextElementSibling;
  if (!next) return;

  const ctrl = controllers[name];
  ctrl?.init?.();

  next.classList.add('page-entering');
  next.classList.remove('hidden');
  current.classList.add('page-leaving');

  animate(current, { opacity: [0, 1] }, {
    visibility: 'visible', duration: DURATION.TRANSITION, easing: EASING.EASE_OUT_SINE,
  }).then(() => { current.classList.remove('page-current'); current.classList.add('hidden'); });

  animate(next, { opacity: [1, 0] }, {
    visibility: 'visible', duration: DURATION.TRANSITION, easing: EASING.EASE_OUT_SINE,
  }).then(() => {
    next.classList.add('page-current');
    next.classList.remove('page-entering');
    currentPage = next;
    ctrl?.animate?.();
  });
}

export function next(name) { go(name); }

export const router = { register, init, go, next, start: go };

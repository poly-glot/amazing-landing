/**
 * @module LandingPage
 * Landing page — simple init with show-questions button.
 */

import { qs } from '../../shared/core/dom.js';
import { router } from '../../shared/core/router.js';

export class LandingPage {
  mount() {
    // The "Start" button has data-rel="show-age"
    qs('.page-landing .next-question')?.addEventListener('click', (e) => {
      e.preventDefault();
      router.go('questions-age');
    });
  }

  init() {}
  animate() {}
}

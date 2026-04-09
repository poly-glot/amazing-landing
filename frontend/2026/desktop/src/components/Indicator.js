/**
 * @module Indicator
 * Quiz progress dots with animated show/hide transitions via WAAPI.
 */

import { DURATION, EASING } from '../core/constants.js';
import { qsa } from '../core/dom.js';
import { animate } from '../core/animate.js';

export class Indicator {
  dom  = null;
  dots = [];
  #initialized = false;

  mount() {
    this.dom  = document.querySelector('.indicator');
    this.dots = qsa('.indicator .ind-col');
  }

  show() {
    animate(this.dom,
      { opacity: [1, 0], blur: [0, 10], translateY: [0, -500] },
      { visibility: 'visible', duration: DURATION.INDICATOR, easing: EASING.EASE_OUT_SINE },
    ).then(() => {
      if (this.#initialized) return;
      this.setProgress(1);
      this.#initialized = true;
    });
  }

  hide() {
    animate(this.dom,
      { opacity: [0, 1], blur: [10, 0], translateY: [-500, 0] },
      { visibility: 'visible', duration: DURATION.INDICATOR, easing: EASING.EASE_OUT_SINE },
    );
  }

  setProgress(step) {
    for (let i = 0; i < step; i++) {
      this.dots[i]?.classList.add('ind-col-active');
    }
  }
}

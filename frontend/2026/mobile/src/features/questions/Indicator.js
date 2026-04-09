/**
 * @module Indicator
 * Quiz progress dots — simple mobile version.
 * Ported from mobile's azadi-indicator.js.
 */

import { qsa } from '../../shared/core/dom.js';

export class Indicator {
  dom  = null;
  dots = [];

  mount() {
    this.dom  = document.querySelector('.indicator');
    this.dots = qsa('.indicator .ind-col');
  }

  show() {
    if (this.dom) this.dom.style.display = '';
  }

  hide() {
    if (this.dom) this.dom.style.display = 'none';
  }

  setProgress(step) {
    for (let i = 0; i < step; i++) {
      this.dots[i]?.classList.add('ind-col-active');
    }
  }
}

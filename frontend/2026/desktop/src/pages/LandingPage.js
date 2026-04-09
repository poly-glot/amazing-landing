/**
 * @module LandingPage
 * Landing animation sequence: strips → products → logo → CTA.
 * No Velocity calls here — delegates to animations/sequences.js.
 */

import { qsa, hide } from '../core/dom.js';
import { animateStrips, animateProducts, animateTaglines, animateCTA } from '../animations/sequences.js';

export class LandingPage {
  #stripes            = [];
  #products           = [];
  #productBackgrounds = [];
  #introduction       = null;
  #logo               = null;
  #ctaText            = null;
  #ctaButton          = null;
  #legalLinks         = null;
  #stripInitialX      = 0;

  init() {
    this.#stripes            = qsa('.page-landing .strips-container .absolute-bg-container');
    this.#products           = qsa('.page-landing .landing-products .landing-item');
    this.#productBackgrounds = qsa('.page-landing .strips-container .product-bg');
    this.#stripInitialX      = -(this.#stripes[0]?.offsetWidth ?? 0);

    this.#introduction = document.querySelector('.page-landing .landing-introduction');
    this.#logo         = document.querySelector('.site-logo');
    this.#ctaText      = document.querySelector('.page-landing .cta-text');
    this.#ctaButton    = document.querySelector('.page-landing .two-lines-button');
    this.#legalLinks   = document.querySelector('.page-landing .legal-links');

    hide(this.#stripes, this.#products, this.#productBackgrounds,
         [this.#introduction, this.#logo, this.#ctaText, this.#ctaButton, this.#legalLinks].filter(Boolean));

    for (const bg of this.#productBackgrounds) bg.style.opacity = '0';
  }

  animate() {
    animateStrips([...this.#stripes], this.#stripInitialX, () =>
      animateProducts([...this.#products], [...this.#productBackgrounds], () =>
        animateTaglines(this.#logo, this.#introduction, this.#ctaText, () =>
          animateCTA(this.#ctaButton, this.#legalLinks))));
  }
}

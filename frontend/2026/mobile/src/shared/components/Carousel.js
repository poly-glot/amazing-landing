/**
 * @module Carousel
 * Minimal vanilla-JS carousel replacing Owl Carousel.
 * Uses CSS transform: translateX() for hardware-accelerated sliding.
 *
 * @example
 *   const c = new Carousel(el, { items: 3, margin: 10, nav: true, autoplay: true });
 *   c.destroy();
 */

export class Carousel {
  /** @type {number} */  #index = 0;
  /** @type {number} */  #maxIndex = 0;
  /** @type {number|null} */ #timer = null;
  /** @type {AbortController} */  #ac = new AbortController();
  /** @type {HTMLElement} */  #track;
  /** @type {HTMLElement|null} */ #nav = null;
  /** @type {HTMLElement[]} */ #items;
  /** @type {HTMLElement} */  #el;
  /** @type {Object} */  #opts;

  /**
   * @param {HTMLElement} el  Container element whose children are slides
   * @param {Object}  opts
   * @param {number}  [opts.items=1]
   * @param {number}  [opts.margin=0]
   * @param {boolean} [opts.nav=false]
   * @param {string[]} [opts.navText=['&lsaquo;','&rsaquo;']]
   * @param {boolean} [opts.autoplay=false]
   * @param {number}  [opts.autoplayInterval=5000]
   * @param {boolean} [opts.loop=false]
   * @param {boolean} [opts.dots=true]
   * @param {Function} [opts.onChanged]
   */
  constructor(el, opts = {}) {
    this.#el = el;
    this.#opts = Object.assign(
      { items: 1, margin: 0, nav: false, navText: ['&#x2039;', '&#x203a;'],
        autoplay: false, autoplayInterval: 5000, loop: false, dots: true, onChanged: null },
      opts,
    );

    this.#items = [...el.children];
    if (!this.#items.length) return;

    this.#maxIndex = Math.max(0, this.#items.length - this.#opts.items);

    this.#buildDOM();
    this.#layout();
    if (this.#opts.nav && this.#maxIndex > 0) this.#buildNav();
    if (this.#opts.autoplay && this.#maxIndex > 0) this.#startAutoplay();

    // Recalculate widths on resize
    window.addEventListener('resize', this.#onResize, { signal: this.#ac.signal });
  }

  /* ---- DOM construction ---- */

  #buildDOM() {
    const outer = document.createElement('div');
    outer.className = 'owl-stage-outer';
    this.#track = document.createElement('div');
    this.#track.className = 'owl-stage';
    this.#track.style.cssText = 'display:flex;transition:transform .35s ease';

    this.#items.forEach(item => this.#track.appendChild(item));
    outer.appendChild(this.#track);
    this.#el.appendChild(outer);
  }

  #buildNav() {
    const [prev, next] = this.#opts.navText;
    this.#nav = document.createElement('div');
    this.#nav.className = 'owl-nav';
    this.#nav.innerHTML =
      `<button type="button" class="owl-prev" aria-label="Previous">${prev}</button>` +
      `<button type="button" class="owl-next" aria-label="Next">${next}</button>`;
    this.#el.appendChild(this.#nav);

    const sig = { signal: this.#ac.signal };
    this.#nav.querySelector('.owl-prev').addEventListener('click', () => this.#go(this.#index - 1), sig);
    this.#nav.querySelector('.owl-next').addEventListener('click', () => this.#go(this.#index + 1), sig);
  }

  /* ---- Layout ---- */

  #layout() {
    const { items, margin } = this.#opts;
    const containerW = this.#el.getBoundingClientRect().width;
    const itemW = (containerW - margin * (items - 1)) / items;

    this.#items.forEach((item, i) => {
      item.style.flex = '0 0 auto';
      item.style.width = `${itemW}px`;
      item.style.marginRight = i < this.#items.length - 1 ? `${margin}px` : '0';
    });

    this.#slide(false);
  }

  #onResize = () => this.#layout();

  /* ---- Navigation ---- */

  #go(target) {
    const idx = this.#opts.loop
      ? (target + this.#maxIndex + 1) % (this.#maxIndex + 1)
      : Math.max(0, Math.min(target, this.#maxIndex));
    if (idx === this.#index) return;
    this.#index = idx;
    this.#slide(true);
    this.#opts.onChanged?.({ index: this.#index });
    if (this.#timer) this.#restartAutoplay();
  }

  #slide(animate) {
    const { margin } = this.#opts;
    const containerW = this.#el.getBoundingClientRect().width;
    const items = this.#opts.items;
    const itemW = (containerW - margin * (items - 1)) / items;
    const offset = this.#index * (itemW + margin);

    this.#track.style.transition = animate ? 'transform .35s ease' : 'none';
    this.#track.style.transform = `translateX(-${offset}px)`;
  }

  /* ---- Autoplay ---- */

  #startAutoplay() {
    this.#timer = setInterval(() => this.#go(this.#index + 1), this.#opts.autoplayInterval);
  }

  #restartAutoplay() {
    clearInterval(this.#timer);
    this.#startAutoplay();
  }

  /* ---- Public API ---- */

  destroy() {
    this.#ac.abort();
    if (this.#timer) clearInterval(this.#timer);
    this.#nav?.remove();

    // Restore original children directly under el
    const outer = this.#el.querySelector('.owl-stage-outer');
    if (outer) {
      this.#items.forEach(item => {
        item.style.flex = '';
        item.style.width = '';
        item.style.marginRight = '';
        this.#el.appendChild(item);
      });
      outer.remove();
    }
  }
}

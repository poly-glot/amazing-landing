/**
 * @module VoucherPage
 * Personalized voucher with product carousel, promotion offer, social sharing.
 * Ported from mobile's voucher.js — all jQuery replaced with vanilla.
 * Key fix: IE overrides clone data (don't mutate originals).
 */

import { PDF_LINK, PROMOTION_SLUG, BASE_HOST } from '../../shared/core/constants.js';
import { qs, qsa, param } from '../../shared/core/dom.js';
import { recommendations, ieOverrides, findOutMoreLinks } from './recommendations.js';
import { Carousel } from '../../shared/components/Carousel.js';
import { ShareButtons } from './ShareButtons.js';

const NAV_TEXT = [
  '<svg class="prev-icon"><use xlink:href="#arrow-prev"></use></svg>',
  '<svg class="next-icon"><use xlink:href="#arrow-next"></use></svg>',
];

export class VoucherPage {
  #customer;
  #stores;
  #page   = null;
  #header = null;
  #body   = null;

  constructor(customer, storesMap) {
    this.#customer = customer;
    this.#stores   = storesMap;
  }

  mount() {
    this.#page   = qs('#page-questions-voucher');
    this.#header = qs('.page-header', this.#page);
    this.#body   = qs('.page-content', this.#page);
  }

  init() {
    const country = (this.#customer.country ?? 'gb').toLowerCase();
    if (country === 'ie') applyIeOverrides();

    const product = this.#customer.suggested_product() ?? 'Bloom';
    const store   = this.#stores.get_by_id(this.#customer.store_id);

    this.#populateDOM(product, store, country);
    this.#buildCarousel(product);

    new ShareButtons(this.#customer, PROMOTION_SLUG, BASE_HOST).enable();
    setFindOutMoreLink(product, country);

    // Show email preview link if available
    if (this.#customer._email_preview_url) {
      const actions = qs('.voucher-actions', this.#page);
      if (actions) {
        const link = document.createElement('a');
        link.href = this.#customer._email_preview_url;
        link.textContent = 'View your voucher email';
        link.target = '_blank';
        link.className = 'btn btn-default email-preview-link';
        actions.appendChild(link);
      }
    }

  }

  animate() {}

  #buildCarousel(product) {
    const items = recommendations[product] ?? [];
    const carousel = qs('.product-carousel', this.#page);
    if (!carousel) return;

    const card = (it) => {
      const safeUrl = escapeAttr(it.url);
      const safeName = escapeHtml(it.name);
      const safeType = escapeHtml(it.type);

      return `<div class="product-item item">` +
        `<h4 class="text-uppercase">${safeType}</h4>` +
        `<a href="${safeUrl}" class="external-image" target="_blank" rel="noopener noreferrer">` +
        `<img src="/assets/carousel-images/${escapeAttr(it.image)}" class="img-responsive" /></a>` +
        `<p>${safeName}<br /><strong>${it.price}</strong></p>` +
        `<a href="${safeUrl}" class="external-link" target="_blank" rel="noopener noreferrer">View Product</a></div>`;
    };

    let html = items.map(card).join('');

    // Repeat items for longer carousels (same as legacy behavior)
    if (items.length > 3) {
      const template = html;
      for (let i = 1; i <= 4; i++) {
        html += template;
      }
    }

    carousel.innerHTML = html;

    // Initialize carousel after a brief delay for DOM paint
    setTimeout(() => {
      new Carousel(carousel, {
        items: 1, nav: true, loop: false, margin: 10, dots: false, autoplay: false,
        navText: NAV_TEXT,
      });
    }, 700);
  }

  #populateDOM(product, store, country) {
    if (store) {
      const storeAddr = qs('#store-address', this.#page);
      if (storeAddr) storeAddr.textContent = store.address;
    }

    const firstnameEl = qs('#firstname', this.#page);
    if (firstnameEl) firstnameEl.textContent = this.#customer.firstname;

    const productNameEl = qs('#product-name', this.#page);
    if (productNameEl) productNameEl.textContent = product;

    // PDF Link
    if (store) {
      const printLink = qs('#print_link', this.#page);
      if (printLink) {
        printLink.href = PDF_LINK + param({
          name: this.#customer.firstname,
          address: store.address,
          product,
          country,
        });
      }
    }
  }
}

// ── IE Overrides (clone, don't mutate) ─────────────────────────────

function applyIeOverrides() {
  const tcLink = qs('.terms-and-condition-link');
  if (tcLink) tcLink.href = 'http://ie.azadi.com/terms-conditions,103,1,70225,440019.htm#Codes';

  for (const el of qsa('.currency')) el.innerHTML = '\u20AC';
  for (const el of qsa('.amount1'))  el.textContent = '15';
  for (const el of qsa('.amount2'))  el.textContent = '35';

  for (const [product, overrides] of Object.entries(ieOverrides)) {
    const items = recommendations[product];
    if (!items) continue;
    // Clone to avoid mutating the original data
    overrides.forEach((o, i) => {
      if (items[i]) recommendations[product][i] = { ...items[i], ...o };
    });
  }
}

function setFindOutMoreLink(product, country) {
  const region = country === 'ie' ? 'ie' : 'uk';
  const url = findOutMoreLinks[region]?.[product.toLowerCase()];
  const link = qs('#find-out-more');
  if (url && link) link.href = url;
}

// ── Sanitization Helpers ────────────────────────────────────────────

function escapeHtml(str) {
  const el = document.createElement('span');
  el.textContent = str ?? '';
  return el.innerHTML;
}

function escapeAttr(str) {
  const el = document.createElement('span');
  el.textContent = str ?? '';
  return el.innerHTML;
}

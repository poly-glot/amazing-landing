/**
 * @module VoucherPage
 * Personalized voucher with product carousel, promotion offer, social sharing.
 * Animations via WAAPI. Zero jQuery dependency.
 */

import { PDF_LINK, PROMOTION_SLUG } from '../core/constants.js';
import { qs, param } from '../core/dom.js';
import { runSequence } from '../core/animate.js';
import { recommendations, ieOverrides, findOutMoreLinks } from '../data/recommendations.js';
import { buildVoucherReveal } from '../animations/sequences.js';
import { Carousel } from '../components/Carousel.js';
import { ShareButtons } from '../components/ShareButtons.js';

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
    this.#page   = qs('.page-voucher');
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

    this.#header.style.visibility = 'hidden';
    this.#body.style.visibility   = 'hidden';

    new ShareButtons(this.#customer, PROMOTION_SLUG, window.basehost ?? '').enable();
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

  animate() {
    runSequence(buildVoucherReveal(this.#header, this.#body, () => this.#initCarousel()));
  }

  #buildCarousel(product) {
    const items = recommendations[product] ?? [];
    const card  = (it) =>
      `<div class="product-item item">` +
      `<h4 class="text-uppercase">${it.type}</h4>` +
      `<a href="${it.url}" class="external-image" target="_blank"><img src="/assets/carousel-images/${it.image}" class="img-responsive" /></a>` +
      `<p>${it.name}<br /><strong>${it.price}</strong></p>` +
      `<a href="${it.url}" class="external-link" target="_blank">View Product</a></div>`;

    let html = items.map(card).join('');
    if (items.length > 3) html = html.repeat(5);
    qs('.product-carousel').innerHTML = html;
  }

  #initCarousel() {
    const el = qs('.product-carousel');
    const n  = el.querySelectorAll('.product-item').length;

    new Carousel(el, n <= 3
      ? { items: n, margin: 10, nav: false, autoplay: false }
      : { items: 3, margin: 10, nav: true, autoplay: true, navText: NAV_TEXT });
  }

  #populateDOM(product, store, country) {
    if (store) qs('#store-address', this.#page).textContent = store.address;
    qs('#firstname', this.#page).textContent    = this.#customer.firstname;
    qs('#product-name', this.#page).textContent = product;

    if (store) {
      const link = qs('#print_link');
      if (link) link.href = PDF_LINK + param({ name: this.#customer.firstname, address: store.address, product, country });
    }
  }
}

function applyIeOverrides() {
  const tcLink = qs('.terms-and-condition-link');
  if (tcLink) tcLink.href = 'http://ie.azadi.com/terms-conditions,103,1,70225,440019.htm#Codes';
  for (const el of document.querySelectorAll('.currency')) el.innerHTML = '\u20AC';
  for (const el of document.querySelectorAll('.amount1'))  el.textContent = '15';
  for (const el of document.querySelectorAll('.amount2'))  el.textContent = '35';
  for (const [product, overrides] of Object.entries(ieOverrides)) {
    const items = recommendations[product];
    if (!items) continue;
    overrides.forEach((o, i) => { if (items[i]) recommendations[product][i] = { ...items[i], ...o }; });
  }
}

function setFindOutMoreLink(product, country) {
  const region = country === 'ie' ? 'ie' : 'uk';
  const url = findOutMoreLinks[region]?.[product.toLowerCase()];
  const link = qs('#find-out-more');
  if (url && link) link.href = url;
}

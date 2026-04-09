/**
 * @module ResultsPage
 * Product reveal, customer form, store locator, hero transition.
 * Ported from mobile's azadi-results.js — all jQuery replaced with vanilla.
 * XSS fixes: store data is sanitized before innerHTML.
 */

import { BASE_URL, PRODUCT_BG_MAP, PRODUCT_LOGO_COLOR, PRODUCT_TEXT_CLASS } from '../../shared/core/constants.js';
import { qs, qsa, showPopover, destroyPopover } from '../../shared/core/dom.js';
import { animate } from '../../shared/core/animate.js';
import { Carousel } from '../../shared/components/Carousel.js';

export class ResultsPage {
  #customer;
  #stores;
  #page        = null;
  #form        = null;
  #storeItems  = null;
  #autocomplete = null;
  #swapped     = false;
  #carousel    = null;

  constructor(customer, storesMap) {
    this.#customer = customer;
    this.#stores   = storesMap;
  }

  mount() {
    this.#page       = qs('#page-questions-results');
    this.#form       = qs('.customer-information', this.#page);
    this.#storeItems = qs('.store-items', this.#page);

    qs('#reload-google-map')?.addEventListener('click', (e) => {
      e.preventDefault();
      const s = document.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?signed_in=true&libraries=places&callback=mapLoaded';
      document.head.appendChild(s);
    });
  }

  init() {
    const product = this.#customer.suggested_product() ?? 'Bloom';
    this.#applyTheme(product);
    this.#insertProductImages(product);
  }

  animate() {}

  // ── Public Actions ────────────────────────────────────────────

  showStores() {
    const hero         = qs('.hero-transition-container', this.#page);
    if (hero) hero.style.minHeight = `${hero.offsetHeight}px`;

    const customerForm = qs('.customer-information', hero);
    const storesForm   = qs('.store-information', hero);

    // Hide instructions
    const note = qs('.speical-note', this.#form);
    if (note) note.style.display = 'none';

    this.#initStoreCarousel();

    // Fade out customer form, fade in stores form
    if (customerForm) {
      animate(customerForm, { opacity: [0, 1] }, { duration: 150, easing: 'ease-out', complete: () => customerForm.remove() });
    }

    if (storesForm) {
      Object.assign(storesForm.style, { position: 'absolute', opacity: '0' });
      storesForm.classList.remove('hidden');

      animate(storesForm, { opacity: [1, 0] }, {
        duration: 150, easing: 'ease-in',
        complete: () => {
          storesForm.style.position = 'static';
          storesForm.style.opacity = '1';

          if (this.#storeItems) {
            this.#storeItems.style.display = '';
          }

          const input = qs('input[name="location"]', storesForm);
          if (input) {
            input.disabled = false;
            this.#autocomplete = new google.maps.places.Autocomplete(input);
            this.#autocomplete.addListener('place_changed', () => this.#onAddressSelected());
          }

          this.#swapped = true;
        },
      });
    }
  }

  showError(fieldName, errorMessage) {
    const input = this.#swapped
      ? qs(`.store-information [name="${fieldName}"]`, this.#page)
      : qs(`[name="${fieldName}"]`, this.#form);

    if (!input) { alert(`${fieldName}: ${errorMessage}`); return; }

    const container = input.parentElement;
    showPopover(container, errorMessage);

    if (this.#swapped) {
      input.addEventListener('keyup', function once() {
        destroyPopover(container);
        input.removeEventListener('keyup', once);
      });
    }
  }

  // ── Store Carousel ─────────────────────────────────────────────

  #initStoreCarousel() {
    if (this.#carousel) { this.#carousel.destroy(); this.#carousel = null; }

    const counter = qs('#current-store-index', this.#page);
    const items   = qsa('.store-item', this.#storeItems);

    if (counter) counter.textContent = '1';
    const totalEl = qs('#total-stores', this.#page);
    if (totalEl) totalEl.textContent = String(items.length);

    if (items.length <= 1) return;

    this.#carousel = new Carousel(this.#storeItems, {
      items: 1, nav: true, margin: 0, autoplay: false,
      navText: [
        '<svg class="prev-icon"><use xlink:href="#arrow-prev"></use></svg>',
        '<svg class="next-icon"><use xlink:href="#arrow-next"></use></svg>',
      ],
      onChanged: ({ index }) => {
        if (counter) counter.textContent = String(index + 1);
        const id = qsa('.store-item', this.#storeItems)[index]?.dataset.id;
        if (id) {
          this.#customer.store_id = id;
          this.#customer.update_store();
        }
      },
    });
  }

  // ── Address / Geocode ─────────────────────────────────────────

  #onAddressSelected() {
    const place = this.#autocomplete.getPlace();
    if (!place.geometry) {
      this.showError('location', 'We could not find your location. Make sure your search is spelled correctly. Try adding a city, town, or postcode.');
      return;
    }

    const geo = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
    const stores = this.#stores.get_by_geocode(geo);
    insertStores(stores, this.#storeItems);

    const country = place.address_components.find((p) => p.types.includes('country'))?.short_name ?? 'GB';

    if (stores.length > 0) {
      this.#customer.set_address({
        address: place.formatted_address,
        country,
        ...geo,
        store_id: stores[0].id,
      });

      if (this.#swapped) this.#initStoreCarousel();
    } else {
      this.showError('location', 'Sorry, We were unable to find any participating stores for specified location.');
    }
  }

  // ── Init Helpers ──────────────────────────────────────────────

  #applyTheme(product) {
    if (!this.#page) return;

    this.#page.classList.remove('bg-yellow', 'bg-red', 'bg-blue', 'bg-sky', 'text-white');
    this.#page.classList.add(PRODUCT_BG_MAP[product]);

    const textClass = PRODUCT_TEXT_CLASS[product];
    if (textClass) this.#page.classList.add(textClass);

    // Logo color
    const logo = qs('.site-logo', this.#page);
    if (logo) logo.className = `site-logo ${PRODUCT_LOGO_COLOR[product]}`;
  }

  #insertProductImages(product) {
    const slug = product.toLowerCase();
    const productDiv = qs(`#product-${product}`, this.#page);

    if (productDiv) {
      const imgEl = qs('.product-image', productDiv);
      if (imgEl) imgEl.innerHTML = `<img src="/assets/images/products/product-${slug}.png" class="img-responsive" />`;
      productDiv.classList.remove('hidden');
    }

    // Insert image on voucher page too
    const voucherImg = qs('.page-voucher .final-product');
    if (voucherImg) {
      voucherImg.innerHTML = `<img src="/assets/images/voucher-products/mobile/product-${slug}.png" class="img-responsive" />`;
    }
  }
}

// ── Store Markup ────────────────────────────────────────────────────

function escapeHtml(str) {
  const el = document.createElement('span');
  el.textContent = str ?? '';
  return el.innerHTML;
}

function sanitizeUrl(url) {
  try { const u = new URL(url); return ['http:', 'https:'].includes(u.protocol) ? u.href : '#'; }
  catch { return '#'; }
}

export function insertStores(stores, container) {
  if (!container) container = qs('.store-items');
  if (!container) return;

  container.innerHTML = stores.map((s) => {
    const town    = escapeHtml(s.town);
    const address = escapeHtml(s.address);
    const mapLink = sanitizeUrl(s.map_link);
    const image   = sanitizeUrl(s.image);
    const id      = escapeHtml(String(s.id));

    return `<div class="store-item" data-id="${id}"><div class="row">` +
      `<div class="col-xs-5 text-center"><a href="${mapLink}" class="store-image" target="_blank" rel="noopener noreferrer"><img src="${image}" alt="" /></a></div>` +
      `<div class="col-xs-7"><p><b class="store-name">${town}</b><br /><span class="store-address">${address}</span></p>` +
      `<a href="${mapLink}" class="map-link map-icon text-dark-brown" target="_blank" rel="noopener noreferrer"><u>View on map</u></a></div>` +
      `</div></div>`;
  }).join('');
}

/**
 * @module ResultsPage
 * Product reveal, customer form, store locator, hero transition.
 * Animations via WAAPI. Zero jQuery dependency.
 */

import { BASE_URL, PRODUCT_BG_MAP, PRODUCT_LOGO_COLOR } from '../core/constants.js';
import { qs, qsa, showPopover, destroyPopover } from '../core/dom.js';
import { animate, runSequence } from '../core/animate.js';
import { buildResultsReveal } from '../animations/sequences.js';
import { Carousel } from '../components/Carousel.js';
import { api } from '../core/api.js';
import { captureTracking } from '../core/tracking.js';
import { router } from '../core/router.js';

export class ResultsPage {
  #customer;
  #stores;
  #page        = null;
  #form        = null;
  #storeItems  = null;
  #autocomplete = null;
  #swapped     = false;
  #sequence    = [];
  #carousel    = null;

  constructor(customer, storesMap) {
    this.#customer = customer;
    this.#stores   = storesMap;
  }

  // ── Lifecycle ───────────────────────────────────────────────────

  mount() {
    this.#page       = qs('.page-results');
    this.#form       = qs('.customer-information', this.#page);
    this.#storeItems = qs('.store-items', this.#page);

    qs('#reload-google-map')?.addEventListener('click', (e) => {
      e.preventDefault();
      const s = document.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?signed_in=true&libraries=places&callback=mapLoaded';
      document.head.appendChild(s);
    });

    qs('#get-your-voucher-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.#onGetVoucher();
    });
  }

  init() {
    const product    = this.#customer.suggested_product() ?? 'Bloom';
    const productDiv = qs(`#product-${product}`, this.#page);

    this.#applyTheme(product);
    this.#insertProductImages(product, productDiv);
    this.#prepareForAnimation(productDiv);

    this.#sequence = buildResultsReveal(
      qs('.product-title', productDiv),
      qs('.product-description', productDiv),
      qs('.product-image', productDiv),
      qs('.form-container', this.#page),
    );
  }

  animate() {
    runSequence(this.#sequence);
  }

  // ── Public Actions ────────────────────────────────────────────

  showStores() {
    const inputs   = qsa('.form-group:not(.form-group-location)', this.#form).reverse();
    const sequence = inputs.map((el) => ({
      elements: el,
      properties: { opacity: [0, 1], translateY: [-20, 0] },
      options:    { duration: 100, easing: 'ease-out' },
    }));

    const hero         = qs('.hero-transition-container', this.#page);
    const customerForm = qs('.customer-information', hero);
    const storesForm   = qs('.store-information', hero);
    const locField     = qs('.form-group-location', customerForm);
    const firstField   = qs('.form-group-firstname', customerForm);
    const newTop       = (locField.offsetTop - firstField.offsetTop) * -1;

    hero.style.height = `${hero.offsetHeight}px`;
    Object.assign(storesForm.style, { position: 'absolute', opacity: '0' });
    storesForm.classList.remove('hidden');
    qs('input', locField).disabled = true;
    qs('.form-group-location input', storesForm).value = qs('input', locField).value;

    sequence.push({
      elements: locField,
      properties: { top: [newTop, 0] },
      options: {
        duration: 150,
        easing: 'easeInQuint',
        begin: () => this.#heroSwap(customerForm, storesForm),
      },
    });

    runSequence(sequence);
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

  hide() {
    const reversed = this.#sequence.map((item) => {
      if (!item.properties) return { ...item };
      const props = {};
      for (const [k, v] of Object.entries(item.properties)) {
        props[k] = Array.isArray(v) ? [v[1], v[0]] : v;
      }
      return { ...item, properties: props, options: { ...item.options } };
    }).reverse();

    reversed.push({
      elements: qs('#main-logo'),
      properties: { opacity: [0, 1] },
      options: { display: 'none', duration: 300, easing: 'ease-out', complete: () => router.next('voucher') },
    });

    runSequence(reversed);
  }

  // ── Hero Transition ───────────────────────────────────────────

  #heroSwap(customerForm, storesForm) {
    qs('.special-note', this.#page)?.style.setProperty('display', 'none');
    this.#initStoreCarousel();

    animate(customerForm,
      { opacity: [0, 1] },
      { delay: 90, duration: 150, easing: 'ease-out', complete: () => customerForm.remove() },
    );

    animate(storesForm,
      { opacity: [1, 0] },
      { duration: 150, easing: 'ease-in',
        complete: () => {
          storesForm.style.position = 'static';

          animate(this.#storeItems,
            { opacity: [1, 0] },
            { visibility: 'visible', delay: 200, duration: 150, easing: 'ease-in' },
          );

          const input = qs('input[name="location"]', storesForm);
          input.disabled = false;
          this.#autocomplete = new google.maps.places.Autocomplete(input);
          this.#autocomplete.addListener('place_changed', () => this.#onAddressSelected());
          this.#swapped = true;
        },
      },
    );
  }

  // ── Store Carousel ─────────────────────────────────────────────

  #initStoreCarousel() {
    if (this.#carousel) { this.#carousel.destroy(); this.#carousel = null; }

    const counter = qs('#current-store-index', this.#page);
    const items   = qsa('.store-item', this.#storeItems);
    counter.textContent = '1';
    qs('#total-stores', this.#page).textContent = String(items.length);

    if (items.length <= 1) return;

    this.#carousel = new Carousel(this.#storeItems, {
      items: 1, nav: true, margin: 0, autoplay: false,
      navText: [
        '<svg class="prev-icon"><use xlink:href="#arrow-prev"></use></svg>',
        '<svg class="next-icon"><use xlink:href="#arrow-next"></use></svg>',
      ],
      onChanged: ({ index }) => {
        counter.textContent = String(index + 1);
        const id = qsa('.store-item', this.#storeItems)[index]?.dataset.id;
        if (id) { this.#customer.store_id = id; this.#customer.update_store(); }
      },
    });
  }

  // ── Address / Geocode ─────────────────────────────────────────

  #onAddressSelected() {
    const place = this.#autocomplete.getPlace();
    if (!place.geometry) { this.showError('location', 'We could not find your location.'); return; }

    const geo    = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
    const stores = this.#stores.get_by_geocode(geo);
    insertStores(stores);

    const country = place.address_components.find((p) => p.types.includes('country'))?.short_name ?? 'GB';

    if (stores.length > 0) {
      this.#customer.set_address({ address: place.formatted_address, country, ...geo, store_id: stores[0].id });
      if (this.#swapped) this.#initStoreCarousel();
    } else {
      this.showError('location', 'Sorry, no participating stores found for this location.');
    }
  }

  #onGetVoucher() {
    const store = this.#stores.get_by_id(this.#customer.store_id);
    if (store) { window.MasterTmsUdo = { nearestStore: store.address }; captureTracking(); }

    window.MasterTmsUdo = { questionnaireFormCompleted: '1' };
    captureTracking();
    api.sendEmail(this.#customerData()).then((res) => {
      if (res && res.email_preview_url) {
        this.#customer._email_preview_url = res.email_preview_url;
      }
    });
    this.hide();
  }

  #customerData() {
    return Object.fromEntries(
      Object.entries(this.#customer).filter(([, v]) => typeof v !== 'function'),
    );
  }

  // ── Init Helpers ──────────────────────────────────────────────

  #applyTheme(product) {
    this.#page.classList.remove('bg-yellow', 'bg-red', 'bg-blue', 'bg-sky');
    this.#page.classList.add(PRODUCT_BG_MAP[product]);
    const logoContainer = qs('#main-logo-container');
    if (logoContainer) logoContainer.className = PRODUCT_LOGO_COLOR[product];
  }

  #insertProductImages(product, div) {
    const slug = product.toLowerCase();
    qs('.product-image', div).innerHTML = `<img src="/assets/images/products/product-${slug}.png" class="img-responsive" />`;
    const voucherImg = qs('.page-voucher .final-product');
    if (voucherImg) voucherImg.innerHTML = `<img src="/assets/images/voucher-products/desktop/product-${slug}.png" class="img-responsive" />`;
  }

  #prepareForAnimation(div) {
    qs('.form-container', this.#page).style.visibility = 'hidden';
    for (const el of qsa('.product-title, .product-image, .product-description', div)) {
      el.style.visibility = 'hidden';
    }
    this.#storeItems.style.visibility = 'hidden';
    div.classList.remove('hidden');
  }
}

function escapeHtml(str) {
  const el = document.createElement('span');
  el.textContent = str ?? '';
  return el.innerHTML;
}

function sanitizeUrl(url) {
  try { const u = new URL(url); return ['http:', 'https:'].includes(u.protocol) ? u.href : '#'; }
  catch { return '#'; }
}

export function insertStores(stores) {
  const container = qs('.page-results .store-items');
  container.innerHTML = stores.map((s) => {
    const town    = escapeHtml(s.town);
    const address = escapeHtml(s.address);
    const mapLink = sanitizeUrl(s.map_link);
    const image   = sanitizeUrl(s.image);
    const id      = escapeHtml(String(s.id));

    return `<div class="store-item" data-id="${id}"><div class="row">` +
      `<div class="col-sm-5"><a href="${mapLink}" class="store-image" target="_blank" rel="noopener noreferrer"><img src="${image}" alt="" /></a></div>` +
      `<div class="col-sm-7"><p><b class="store-name">${town}</b><br /><span class="store-address">${address}</span></p>` +
      `<a href="${mapLink}" class="map-link map-icon text-dark-brown" target="_blank" rel="noopener noreferrer"><u>View on map</u></a></div>` +
      `</div></div>`;
  }).join('');
}

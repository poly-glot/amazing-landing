/**
 * @module main
 * Mobile application entry point.
 * Mounts components, wires the boot sequence, and connects modules.
 * Business logic lives in dedicated modules — this file is pure orchestration.
 */

import './shared/styles/index.css';
import '../overrides.css';

import { questionsMap }              from './features/questions/questions.js';
import './features/results/stores.js';
import { applyBackendProducts }      from './features/voucher/recommendations.js';

import { router }                    from './shared/core/router.js';
import { qs, qsa, destroyPopover }   from './shared/core/dom.js';
import { animate }                   from './shared/core/animate.js';
import { api }                       from './shared/core/api.js';
import { customer, customerData }    from './shared/core/customer.js';

import { Indicator }                 from './features/questions/Indicator.js';
import { FormValidator }             from './features/results/FormValidator.js';

import { LandingPage }               from './features/landing/LandingPage.js';
import { QuestionsPage }             from './features/questions/QuestionsPage.js';
import { ResultsPage, insertStores } from './features/results/ResultsPage.js';
import { VoucherPage }               from './features/voucher/VoucherPage.js';

// =====================================================================
// Module-level references (set during DOMContentLoaded)
// =====================================================================

let results, validator, loaderEl;

// =====================================================================
// Boot
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
  const indicator = new Indicator();
  indicator.mount();

  const landing = new LandingPage();
  landing.mount();

  const questions = new QuestionsPage(indicator, questionsMap, customer);
  questions.mount();

  results = new ResultsPage(customer, window.stores_map);
  results.mount();

  const voucher = new VoucherPage(customer, window.stores_map);
  voucher.mount();

  router.register('questions-age', questions);
  router.register('questions-skin', questions);
  router.register('questions-concern', questions);
  router.register('results', { init: () => results.init(), animate: () => results.animate() });
  router.register('voucher', { init: () => voucher.init(), animate: () => voucher.animate() });
  router.init();

  wireCustomerForm();
});

// ── Promotion check (runs on window load) ───────────────────────────

window.addEventListener('load', () => {
  api.getPromotion()
    .then((p) => {
      if (!p) { document.location = 'https://uk.azadi.com/'; return; }

      api.getStores()
        .then((s) => window.stores_map.update(s))
        .catch((e) => console.error(e));

      // Load admin-configured questions + products — required in production
      api.getQuestions()
        .then((config) => questionsMap.applyBackendConfig(config))
        .catch(() => showConfigError('quiz questions'));
      api.getProducts()
        .then((products) => applyBackendProducts(products))
        .catch(() => showConfigError('product recommendations'));

      const loader = qs('#main-loader');
      if (loader) {
        animate(loader, { opacity: [0, 1] }, { display: 'none', duration: 300, easing: 'ease-out' })
          .then(() => loader.remove());
      }
    })
    .catch(() => { document.location = 'https://uk.azadi.com/'; });
});

// =====================================================================
// Customer Form
// =====================================================================

function wireCustomerForm() {
  const formEl = qs('#customer-information-form');
  if (!formEl) return;

  loaderEl  = qs('.customer-information .loader-container');
  validator = new FormValidator(formEl, customer);
  validator.mount();

  const submitBtn = formEl.querySelector('.two-lines-button');
  const prevent   = (fn) => (e) => { e.preventDefault(); fn(); };

  submitBtn?.addEventListener('click', prevent(onSubmit));
  formEl.addEventListener('submit', prevent(onSubmit));
  formEl.addEventListener('change', () => {
    syncCustomerFromForm(formEl);
    validator.validate();
  });
}

function onSubmit() {
  const formEl = qs('#customer-information-form');
  for (const el of qsa('.has-error', formEl)) destroyPopover(el);

  // Brief delay allows change event to propagate and update customer state
  setTimeout(() => {
    syncCustomerFromForm(formEl);

    if (!validator.validateForSubmit((f, m) => results.showError(f, m))) return;

    showLoader();

    api.saveCustomer(customerData(customer))
      .then((res) => {
        if (res.error) {
          for (const [k, v] of Object.entries(res.error)) {
            if (k === 'promotion_link') { alert(v[0]); document.location = 'https://uk.azadi.com/'; return; }
            results.showError(k === 'country' ? 'location' : k, v[0]);
          }
          return;
        }
        if (res.submission_id) customer.submission_id = res.submission_id;
        results.showStores();
      })
      .catch((err) => console.error(err))
      .finally(hideLoader);
  }, 400);
}

function syncCustomerFromForm(formEl) {
  customer.firstname    = qs('#first_name', formEl)?.value;
  customer.lastname     = qs('#last_name', formEl)?.value;
  customer.email        = qs('#email', formEl)?.value;
  customer.subscribe    = qs('#subscribe', formEl)?.checked;
  customer.accept_terms = qs('#terms', formEl)?.checked;
}

function showLoader() {
  if (loaderEl) animate(loaderEl, { opacity: [1, 0] }, { display: 'block', duration: 300, easing: 'ease-in' });
}

function hideLoader() {
  if (loaderEl) animate(loaderEl, { opacity: [0, 1] }, { display: 'none', duration: 300, easing: 'ease-out' });
}

// =====================================================================
// Google Maps
// =====================================================================

window.addEventListener('load', () => {
  loadScript('https://maps.googleapis.com/maps/api/js?signed_in=true&libraries=places&callback=mapLoaded&key=AIzaSyAARy3-Rybhh1o60lzeJfaJiKsnxalRAmI');
});

window.mapLoaded = function onGoogleMapsReady() {
  const input = qs('.customer-information input[name="location"]');
  if (input) input.disabled = false;

  qs('#reload-google-map')?.parentElement?.remove();

  const ac = new google.maps.places.Autocomplete(input);
  ac.addListener('place_changed', () => {
    const place = ac.getPlace();
    if (!place.geometry) { results.showError('location', 'We could not find your location.'); return; }

    const geo     = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
    const stores  = window.stores_map.get_by_geocode(geo);
    const country = place.address_components.find((p) => p.types.includes('country'))?.short_name ?? 'GB';

    insertStores(stores);

    if (stores.length > 0) {
      customer.set_address({ address: place.formatted_address, country, ...geo, store_id: stores[0].id });
      validator?.validate();
    } else {
      results.showError('location', 'Sorry, no participating stores found.');
    }
  });
};

// =====================================================================
// Utilities
// =====================================================================

function loadScript(src) {
  const s = document.createElement('script');
  s.src = src;
  document.head.appendChild(s);
}

function showConfigError(what) {
  console.error(`[Boot] Failed to load ${what} from server`);
  const el = document.createElement('div');
  el.setAttribute('style',
    'position:fixed;top:0;left:0;right:0;padding:14px 20px;background:#c0392b;color:#fff;' +
    'font-family:sans-serif;font-size:14px;text-align:center;z-index:99999');
  el.textContent = `Unable to load ${what}. Please refresh the page or try again later.`;
  document.body.prepend(el);
}


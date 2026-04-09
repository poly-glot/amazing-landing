/**
 * @module customer
 * Customer data model — captures quiz answers, form data, and store selection.
 */

import { questionsMap } from '../data/questions.js';
import { qs } from './dom.js';
export function createCustomer() {
  return {
    firstname: null, lastname: null, email: null,
    subscribe: null, accept_terms: null,
    age: '', skin: '',
    concern_1: null, concern_2: null, product: null,
    store_id: null, address: null, country: null,
    lng: null, lat: null,
    promotion_link: window.main_promotion_slug,

    capture_selection(question, answer) {
      if (!answer) return;
      this[question] = answer;
    },

    suggested_product() {
      this.product ??= questionsMap.getProduct(this.age, [this.concern_1, this.concern_2].filter(Boolean));
      return this.product;
    },

    submit_form() {
      qs('#customer-information-form')?.dispatchEvent(new Event('submit'));
    },

    set_address(obj) {
      Object.assign(this, { address: obj.address, country: obj.country, lat: obj.lat, lng: obj.lng, store_id: obj.store_id });
    },
  };
}

/** Serialize customer to a plain object (strips methods) for API calls. */
export function customerData(customer) {
  return Object.fromEntries(
    Object.entries(customer).filter(([, v]) => typeof v !== 'function'),
  );
}

export const customer = createCustomer();

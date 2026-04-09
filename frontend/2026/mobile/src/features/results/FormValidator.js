/**
 * @module FormValidator
 * Customer form field validation with error popover display.
 * Copied from desktop, adapted for mobile field layout.
 */

import { qs, destroyPopover } from '../../shared/core/dom.js';

const REQUIRED  = ['firstname', 'lastname', 'email', 'accept_terms', 'address'];
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TO_INPUT_NAME = {
  firstname:    'first_name',
  lastname:     'last_name',
  email:        'email',
  accept_terms: 'terms',
  address:      'location',
};

export class FormValidator {
  #form;
  #customer;
  #submitButton;
  #fields = {};

  constructor(form, customer) {
    this.#form         = form;
    this.#customer     = customer;
    this.#submitButton = form.querySelector('.two-lines-button');
  }

  mount() {
    this.#fields = {
      firstname:    qs('#first_name', this.#form),
      lastname:     qs('#last_name', this.#form),
      email:        qs('#email', this.#form),
      accept_terms: qs('#terms', this.#form),
      address:      qs('#location', this.#form),
    };
  }

  validate() {
    let valid = true;
    for (const key of REQUIRED) {
      if (isEmpty(this.#customer[key])) {
        valid = false;
      } else if (key === 'email' && !EMAIL_RE.test(this.#customer[key])) {
        valid = false;
      } else {
        this.#clearError(key);
      }
    }
    this.#submitButton?.classList.toggle('disabled', !valid);
    return valid;
  }

  /** @param {(field: string, msg: string) => void} showError */
  validateForSubmit(showError) {
    let valid = true;
    for (const key of REQUIRED) {
      if (isEmpty(this.#customer[key])) {
        valid = false;
        showError(TO_INPUT_NAME[key], 'Mandatory field');
      } else if (key === 'email' && !EMAIL_RE.test(this.#customer[key])) {
        valid = false;
        showError(TO_INPUT_NAME[key], 'Invalid Email format');
      }
    }
    return valid;
  }

  #clearError(key) {
    const input = this.#fields[key];
    if (!input) return;
    const container = input.parentElement;
    if (container?.classList.contains('has-error')) {
      destroyPopover(container);
    }
  }
}

function isEmpty(val) {
  return !val || (typeof val === 'string' && val.length === 0);
}

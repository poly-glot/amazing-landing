/**
 * @module Modal
 * Vanilla JS replacement for Bootstrap 3 modal.js.
 * Handles data-toggle="modal", data-dismiss="modal", backdrop click,
 * Escape key, and background blur/dim animation on .site-content.
 *
 * Zero jQuery dependencies.
 */

import { EASING } from '../core/constants.js';
import { animate } from '../core/animate.js';

const TRANSITION_MS = 300;

export class Modal {
  #active   = null;
  #backdrop = null;
  #siteContent = null;

  mount() {
    this.#siteContent = document.querySelector('.site-content');

    document.addEventListener('click', (e) => {
      // Open: delegate clicks on [data-toggle="modal"]
      const trigger = e.target.closest('[data-toggle="modal"]');
      if (trigger) {
        e.preventDefault();
        const target = document.querySelector(trigger.getAttribute('data-target'));
        if (target) this.#open(target);
        return;
      }
      // Close: delegate clicks on [data-dismiss="modal"]
      if (e.target.closest('[data-dismiss="modal"]')) {
        e.preventDefault();
        this.#close();
        return;
      }
      // Close: click directly on the .modal overlay (outside .modal-dialog)
      if (this.#active && e.target === this.#active) {
        this.#close();
      }
    });

    // Close: Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.#active) {
        this.#close();
      }
    });
  }

  // ── Private ────────────────────────────────────────────────────────

  #open(modal) {
    if (this.#active) return;
    this.#active = modal;

    this.#backdrop = document.createElement('div');
    this.#backdrop.className = 'modal-backdrop fade';
    document.body.appendChild(this.#backdrop);

    modal.style.display = 'block';
    document.body.classList.add('modal-open');

    // Force reflow before adding .in so the CSS transition triggers
    void modal.offsetHeight;

    modal.classList.add('in');
    this.#backdrop.classList.add('in');

    if (this.#siteContent) {
      animate(this.#siteContent, { opacity: [0.4, 1], blur: [2, 0] }, {
        visibility: 'visible',
        duration: TRANSITION_MS,
        easing: EASING.EASE_OUT_SINE,
      });
    }
  }

  #close() {
    const modal = this.#active;
    if (!modal) return;

    modal.classList.remove('in');
    if (this.#backdrop) this.#backdrop.classList.remove('in');

    if (this.#siteContent) {
      animate(this.#siteContent, { opacity: [1, 0.4], blur: [0, 2] }, {
        visibility: 'visible',
        duration: TRANSITION_MS,
        easing: EASING.EASE_OUT_SINE,
      });
    }

    setTimeout(() => {
      modal.style.display = '';
      document.body.classList.remove('modal-open');
      if (this.#backdrop) {
        this.#backdrop.remove();
        this.#backdrop = null;
      }
      this.#active = null;
    }, TRANSITION_MS);
  }
}

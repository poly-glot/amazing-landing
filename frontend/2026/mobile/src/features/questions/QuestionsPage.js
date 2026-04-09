/**
 * @module QuestionsPage
 * 3-step mobile quiz: age -> skin type -> concerns.
 * Ported from mobile's questions.js — replaced jQuery Mobile page transitions
 * with router.go(), all jQuery DOM ops with vanilla.
 */

import { qs, qsa, delegate } from '../../shared/core/dom.js';
import { router } from '../../shared/core/router.js';

export class QuestionsPage {
  #indicator;
  #map;
  #customer;

  #containers = {};
  #supportsMultiple = false;
  #container = null;
  #step = null;
  #questionSelection = [];

  constructor(indicator, questionsMap, customer) {
    this.#indicator = indicator;
    this.#map       = questionsMap;
    this.#customer  = customer;
  }

  mount() {
    this.#containers = {
      age:     qs('#page-questions-age'),
      skin:    qs('#page-questions-skin'),
      concern: qs('#page-questions-concern'),
    };

    // Delegated click on question links
    delegate(document, 'click', 'a.question-link', (e, target) => {
      e.preventDefault();

      this.#step = target.dataset.rel;
      this.#container = this.#containers[this.#step];

      this.#supportsMultiple = (this.#step === 'concern');

      this.#toggleActiveState(target);
    });

    // Next-question buttons
    delegate(document, 'click', '.next-question', (e, target) => {
      e.preventDefault();

      if (target.classList.contains('disabled')) return;

      const step = target.dataset.rel;

      if (step === 'show-age') {
        this.showAge();
      } else if (step === 'show-skin') {
        this.showSkin();
      } else if (step === 'show-concern') {
        this.showConcern();
      } else if (step === 'show-results') {
        this.showResults();
      } else if (step === 'show-voucher') {
        this.#goToVoucher();
      }
    });
  }

  init() {}
  animate() {}

  // ── Step Display ─────────────────────────────────────────────────

  showAge() {
    const questions = this.#map.getAge();
    let html = '';
    this.#questionSelection = [];

    for (const [, question] of Object.entries(questions)) {
      if (!question) continue;
      html += `<li><a href="#" class="question-link light large text-blue" data-rel="age"><span class="question-text">${question}</span></a></li>`;
    }

    this.#indicator.setProgress(1);

    const list = qs('#page-questions-age .questions');
    if (list) list.innerHTML += html;

    router.go('questions-age');
  }

  showSkin() {
    const questions = this.#map.getSkin(this.#customer.age);
    let html = '';
    this.#questionSelection = [];

    if (questions) {
      for (const [, question] of Object.entries(questions)) {
        if (!question) continue;
        html += `<li><a href="#" class="question-link light large text-blue" data-rel="skin"><span class="question-text">${question}</span></a></li>`;
      }
    }

    this.#indicator.setProgress(2);

    const list = qs('#page-questions-skin .questions');
    if (list) list.innerHTML += html;

    router.go('questions-skin');
  }

  showConcern() {
    const questions = this.#map.getConcerns(this.#customer.age);
    let html = '';
    this.#questionSelection = [];

    if (questions) {
      for (const [, question] of Object.entries(questions)) {
        if (!question) continue;
        html += `<li><a href="#" class="question-link light large text-blue" data-rel="concern"><span class="question-text">${question}</span></a></li>`;
      }
    }

    this.#indicator.setProgress(3);

    const list = qs('#page-questions-concern .questions');
    if (list) list.innerHTML += html;

    router.go('questions-concern');
  }

  showResults() {
    router.go('results');
  }

  // ── Selection Logic ──────────────────────────────────────────────

  #toggleActiveState(currentSelection) {
    if (!this.#supportsMultiple) {
      // Deselect all other active items in this container
      const activeItems = qsa('.question-link.active', this.#container);
      for (const item of activeItems) {
        if (item !== currentSelection) item.classList.remove('active');
      }
    }

    // Add into selection stack
    if (!currentSelection.classList.contains('active')) {
      this.#questionSelection.push(currentSelection);
    }

    currentSelection.classList.toggle('active');

    // Enforce max 2 for multi-select
    if (this.#supportsMultiple) {
      const activeItems = qsa('.question-link.active', this.#container);
      if (activeItems.length > 2) {
        const first = this.#questionSelection.shift();
        first?.classList.remove('active');
      }
    }

    // Toggle next button and capture selection
    const activeAnswers = qsa('.question-link.active', this.#container);
    const numSelections = activeAnswers.length;
    const footer = qs('.page-footer', this.#container);
    const nextBtn = qs('.two-lines-button', this.#container);

    if (!this.#supportsMultiple && numSelections > 0) {
      nextBtn?.classList.remove('disabled');
      footer?.classList.remove('disabled');

      this.#customer.capture_selection(this.#step, activeAnswers[0].textContent.trim());

    } else if (this.#supportsMultiple && numSelections >= 1) {
      const answers = activeAnswers.map((a) => a.textContent.trim());

      if (numSelections === 2) {
        footer?.classList.remove('disabled');
        nextBtn?.classList.remove('disabled');
      } else {
        footer?.classList.add('disabled');
        nextBtn?.classList.add('disabled');
      }

      this.#customer.capture_selection(this.#step, answers);

    } else {
      footer?.classList.add('disabled');
      nextBtn?.classList.add('disabled');
    }
  }

  // ── Voucher Transition ───────────────────────────────────────────

  #goToVoucher() {
    // Send customer email in background
    import('../../shared/core/api.js').then(({ api }) => {
      const data = Object.fromEntries(
        Object.entries(this.#customer).filter(([, v]) => typeof v !== 'function'),
      );
      api.sendEmail(data).then((res) => {
        if (res && res.email_preview_url) {
          this.#customer._email_preview_url = res.email_preview_url;
        }
      });
    });

    router.go('voucher');
  }
}

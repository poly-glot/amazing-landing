/**
 * @module QuestionsPage
 * 3-step quiz: age → skin type → concerns.
 * All animations via WAAPI.
 */

import { DURATION, EASING } from '../core/constants.js';
import { qs, qsa, delegate } from '../core/dom.js';
import { animate } from '../core/animate.js';
import { router } from '../core/router.js';

const STEPS = [
  { css: 'section-title section-title-1 center-block light', title: 'Just between us,<br />what is your age group?', getter: 'getAge',      key: 'age',     multiple: false },
  { css: 'section-title section-title-2 center-block light', title: 'How would you<br />describe your skin?',        getter: 'getSkin',     key: 'skin',    multiple: false },
  { css: 'section-title section-title-3 center-block light', title: 'What are your 2<br />main skin concerns?',      getter: 'getConcerns', key: 'concern', multiple: true  },
];

export class QuestionsPage {
  #indicator;
  #map;
  #customer;

  #title      = null;
  #allItems   = [];
  #cta        = null;
  #grid       = null;
  #gridItems  = [];

  #questions  = [];
  #selection  = [];
  #stepIndex  = 0;
  #step       = null;
  #multi      = false;
  #nextOn     = false;

  constructor(indicator, questionsMap, customer) {
    this.#indicator = indicator;
    this.#map       = questionsMap;
    this.#customer  = customer;
  }

  // ── Lifecycle ───────────────────────────────────────────────────

  mount() {
    this.#grid      = qs('#questions_grid');
    this.#gridItems = qsa('#questions_grid .item');

    for (const el of qsa('.question-text')) el._rel = el.dataset.rel;

    this.#bindHover();
    this.#bindClicks();

    for (const el of qsa('.question-text')) el.style.visibility = 'hidden';
    for (const el of this.#gridItems)      el.style.visibility = 'hidden';
  }

  init() {
    this.#title    = qs('.page-questions .section-title');
    this.#allItems = qsa('.page-questions .questions-container .question-item-container');
    this.#cta      = qs('.page-questions .two-lines-button');

    this.#title.style.visibility = 'hidden';
    for (const el of this.#allItems) el.style.visibility = 'hidden';
    this.#cta.style.visibility = 'hidden';
  }

  animate() {
    this.#indicator.show();
    this.initNextStep();
  }

  // ── Step Flow ─────────────────────────────────────────────────

  initNextStep() {
    if (this.#questions.length > 0) {
      this.disableNext()
        .then(() => this.#hideQuestions())
        .then(() => this.#hideHeader())
        .then(() => this.#loadStep());
      return;
    }
    this.#loadStep();
  }

  #loadStep() {
    this.#step = STEPS[this.#stepIndex];
    if (!this.#step) { this.#gotoResults(); return; }

    this.#multi = this.#step.multiple;
    this.#title.className = this.#step.css;
    qs('.section-title-text', this.#title).innerHTML = this.#step.title;
    this.#indicator.setProgress(this.#stepIndex + 1);

    const container = qs('#all-questions-container');
    container.className = `step-${this.#stepIndex + 1}`;

    if (this.#step.key !== 'age') {
      const slug = this.#customer.age.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      container.classList.add(`age-${slug}`);
    }

    this.#populateQuestions();
    this.#stepIndex++;
  }

  #populateQuestions() {
    const fn = this.#map[this.#step.getter];
    if (typeof fn !== 'function') return;

    const data = fn.call(this.#map, this.#customer.age, this.#customer.skin, this.#customer.concern);
    if (!data) return;

    this.#questions = [];

    for (const el of qsa('.page-questions .questions-container .question-item-container.active')) {
      el.classList.remove('active');
    }

    for (const item of this.#gridItems) {
      const idx = Array.from(item.parentElement.children).indexOf(item);
      item.setAttribute('class', `item question-item-${idx + 1}`);
    }

    for (const [key, value] of Object.entries(data)) {
      const el = qs(`.page-questions .questions-container .${key}`);
      if (!el) continue;
      qs('.question-text-inner', el).innerHTML = value;
      this.#questions.push(el);
    }

    this.#showHeader().then(() => this.#showQuestions());
  }

  #gotoResults() {
    this.disableNext()
      .then(() => this.#hideQuestions())
      .then(() => this.#hideHeader())
      .then(() => {
        const vid = qs('.background-video');
        if (vid) vid.innerHTML = '';
        router.next('results');
      });
  }

  // ── Next Button ───────────────────────────────────────────────

  enableNext() {
    if (this.#nextOn) return;
    this.#nextOn = true;
    this.#cta.style.display = '';

    return animate(this.#cta,
      { opacity: [1, 0], blur: [0, 10], translateY: [0, 200] },
      { visibility: 'visible', duration: 300, easing: EASING.EASE_OUT_SINE });
  }

  disableNext() {
    return animate(this.#cta,
      { opacity: [0, 1], blur: [10, 0], translateY: [200, 0] },
      { visibility: 'hidden', duration: 300, easing: EASING.EASE_OUT_SINE },
    ).then(() => { this.#nextOn = false; this.#cta.style.display = 'none'; });
  }

  // ── Header Animation ─────────────────────────────────────────

  #showHeader() {
    return animate(this.#title,
      { opacity: [1, 0], blur: [0, 10], translateY: [0, -500] },
      { visibility: 'visible', duration: DURATION.QUESTIONS, easing: EASING.EASE_OUT_SINE });
  }

  #hideHeader() {
    return animate(this.#title,
      { opacity: [0, 1], blur: [10, 0], translateY: [-500, 0] },
      { visibility: 'hidden', duration: DURATION.QUESTIONS, easing: EASING.EASE_OUT_SINE });
  }

  // ── Questions Animation ───────────────────────────────────────

  #showQuestions() {
    this.#selection = [];
    if (this.#questions.length === 0) return Promise.resolve();

    const last = this.#questions.length - 1;
    const promises = [];

    this.#questions.forEach((el, i) => {
      const p = animate(el,
        { scale: [1, 0.4], blur: [0, 8], opacity: [1, 0.6], rotateZ: 0 },
        { visibility: 'visible', duration: 300, delay: i * 100, easing: EASING.QUESTION_BOUNCE,
          complete: () => setTimeout(() => {
            const gridEl = qs(`#question-item-${el._rel}`);
            if (gridEl) gridEl.style.visibility = 'visible';
            el.classList.remove('animating');
          }, 1) });

      promises.push(p);
    });

    return Promise.all(promises);
  }

  #hideQuestions() {
    if (this.#questions.length === 0) return;
    this.#questions = [...this.#questions].reverse();

    this.#questions.forEach((el, i) => {
      const idx     = this.#allItems.indexOf(el);
      const diamond = this.#gridItems[idx];
      if (diamond) diamond.style.visibility = 'hidden';
      el.classList.add('animating');

      animate(el,
        { blur: [10, 0], scale: [0.4, 1], opacity: [0.8, 1] },
        { visibility: 'hidden', duration: 150, delay: i * 100, easing: EASING.EASE_OUT_SINE });
    });
  }

  // ── Interaction Handlers ──────────────────────────────────────

  #bindClicks() {
    qs('.page-questions .two-lines-button')
      ?.addEventListener('click', (e) => { e.preventDefault(); this.initNextStep(); });

    delegate(this.#grid, 'click', '.item', (e, target) => {
      const idx = Array.from(target.parentElement.children).indexOf(target);
      this.#toggleActive(this.#allItems[idx]);
    });

    delegate(document, 'click', '.question-text', (e, target) => {
      e.preventDefault();
      this.#toggleActive(target);
    });

    delegate(document, 'click', '.close-icon', (e, target) => {
      e.preventDefault();
      this.#toggleActive(target.parentElement);
    });
  }

  #toggleActive(el) {
    if (!el) return;

    if (!this.#multi) this.#deselectPrevious(el);
    if (!el.classList.contains('active')) this.#selection.push(el);
    el.classList.toggle('active');
    this.#syncDiamond(el);
    if (this.#multi) this.#enforceMaxTwo();
    this.#captureAnswers();
  }

  #captureAnswers() {
    const active = this.#allItems.filter((el) => el.classList.contains('active'));
    const n      = active.length;

    if (!this.#multi && n > 0) {
      this.enableNext();
      this.#customer.capture_selection(this.#step.key, active[0].textContent.trim());
    } else if (this.#multi && n >= 1) {
      n === 2 ? this.enableNext() : this.disableNext();
      this.#customer.capture_selection(this.#step.key, active.map((a) => a.textContent.trim()));
    } else {
      this.disableNext();
    }
  }

  // ── Diamond Grid Helpers ──────────────────────────────────────

  #bindHover() {
    for (const el of qsa('.question-text')) {
      el.addEventListener('mouseenter', () => setDiamondClass(this.#grid, el._rel, true));
      el.addEventListener('mouseleave', () => setDiamondClass(this.#grid, el._rel, false));
    }
  }

  #syncDiamond(el) {
    const i   = this.#allItems.indexOf(el);
    const gem = this.#gridItems[i];
    if (!gem) return;
    gem.setAttribute('class', el.classList.contains('active') ? `item active question-item-${i + 1}` : `item question-item-${i + 1}`);
  }

  #deselectPrevious(current) {
    const prev = this.#allItems.find((el) => el.classList.contains('active') && el !== current);
    if (!prev) return;
    const i   = this.#allItems.indexOf(prev);
    const gem = this.#gridItems[i];
    if (gem) gem.setAttribute('class', current.classList.contains('active') ? `item active question-item-${i + 1}` : `item question-item-${i + 1}`);
    prev.classList.remove('active');
  }

  #enforceMaxTwo() {
    const active = this.#allItems.filter((el) => el.classList.contains('active'));
    if (active.length <= 2) return;
    const first = this.#selection.shift();
    const i     = this.#allItems.indexOf(first);
    first.classList.remove('active');
    const gem = this.#gridItems[i];
    if (gem) gem.setAttribute('class', `item question-item-${i + 1}`);
  }
}

function setDiamondClass(grid, rel, hovering) {
  const id   = `question-item-${rel}`;
  const elem = qs(`#${id}`, grid);
  if (!elem) return;
  const active = elem.classList.contains('active');
  const parts  = ['item'];
  if (hovering) parts.push('hover');
  if (active)   parts.push('active');
  parts.push(id);
  elem.setAttribute('class', parts.join(' '));
}

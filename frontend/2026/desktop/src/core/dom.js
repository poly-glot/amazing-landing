/**
 * @module dom
 * Vanilla DOM utilities replacing the most common jQuery patterns.
 * Keeps the call-sites concise without pulling in a 90 KB library.
 */

/** @param {string} sel  @param {Element|Document} [root] */
export const qs  = (sel, root = document) => root.querySelector(sel);

/** @param {string} sel  @param {Element|Document} [root]  @returns {Element[]} */
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Attach an event listener. Returns an unsubscribe function.
 * @param {EventTarget} el
 * @param {string} event
 * @param {Function} handler
 * @param {Object} [opts]
 */
export function on(el, event, handler, opts) {
  el.addEventListener(event, handler, opts);
  return () => el.removeEventListener(event, handler, opts);
}

/**
 * Delegated event listener — handler fires only when e.target matches `sel`.
 * @param {EventTarget} el      Root element to listen on.
 * @param {string} event        Event name.
 * @param {string} sel          CSS selector to match against.
 * @param {Function} handler    Receives (e, matchedElement).
 */
export function delegate(el, event, sel, handler) {
  const listener = (e) => {
    const target = e.target.closest(sel);
    if (target && el.contains(target)) {
      handler(e, target);
    }
  };
  el.addEventListener(event, listener);
  return () => el.removeEventListener(event, listener);
}

/**
 * Serialize an object to a URL query string (replaces $.param).
 * @param {Object} obj
 * @returns {string}
 */
export function param(obj) {
  return new URLSearchParams(obj).toString();
}

/**
 * Set visibility:hidden on one or more elements/NodeLists.
 * @param {...(Element|Element[]|NodeList)} groups
 */
export function hide(...groups) {
  for (const g of groups) {
    if (g == null) continue;
    const els = g[Symbol.iterator] ? g : [g];
    for (const el of els) el.style.visibility = 'hidden';
  }
}

/**
 * Remove a Bootstrap 3 popover from an element (vanilla replacement).
 * Bootstrap stores its popover instance in jQuery data — we destroy
 * by removing the popover DOM and cleaning the aria attribute.
 * @param {Element} el  The element that has a popover attached.
 */
export function destroyPopover(el) {
  const popoverId = el.getAttribute('aria-describedby');
  if (popoverId) {
    document.getElementById(popoverId)?.remove();
    el.removeAttribute('aria-describedby');
  }
  el.classList.remove('has-error');
}

/**
 * Show a Bootstrap-style popover below an element (vanilla replacement).
 * Creates a minimal popover DOM matching Bootstrap 3's markup/classes.
 * @param {Element} el       The element to attach the popover to.
 * @param {string}  content  Popover text content.
 */
export function showPopover(el, content) {
  destroyPopover(el);

  const id = `popover-${Date.now()}`;
  const popover = document.createElement('div');
  popover.id = id;
  popover.className = 'popover fade bottom in';
  popover.setAttribute('role', 'tooltip');
  popover.innerHTML =
    `<div class="arrow"></div><div class="popover-content">${content}</div>`;

  el.setAttribute('aria-describedby', id);
  el.classList.add('has-error');
  el.appendChild(popover);
}

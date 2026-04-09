/**
 * @module api
 * Fetch-based API client with retry logic.
 */

import { API_BASE, PROMOTION_SLUG } from './constants.js';

const MAX_RETRIES    = 3;
const TIMEOUT_MS     = 5000;
const RETRY_DELAY_MS = 3000;

export function getPromotion(slug) {
  return fetchJSON(`${API_BASE}api/v1/survey/promotion/${slug ?? PROMOTION_SLUG}`)
    .then((r) => r.promotion ?? r);
}

export function getStores() {
  return fetchJSON(`${API_BASE}api/v1/survey/stores`)
    .then((r) => r.stores ?? r);
}

export function saveCustomer(data) {
  return fetchJSON(`${API_BASE}api/v1/survey/customer`, { method: 'POST', body: toFormData(data) });
}

export function updateStore(data) {
  return fetchJSON(`${API_BASE}api/v1/survey/updatestore`, { method: 'POST', body: toFormData(data) });
}

export function sendEmail(data) {
  return fetchJSON(`${API_BASE}api/v1/survey/email`, { method: 'POST', body: toFormData(data) });
}

export function getProducts() {
  return fetchJSON(`${API_BASE}api/v1/survey/products`)
    .then((r) => r.products ?? r);
}

export function getQuestions() {
  return fetchJSON(`${API_BASE}api/v1/survey/questions`);
}

export const api = { getPromotion, getStores, saveCustomer, updateStore, sendEmail, getProducts, getQuestions };

// ── Internal ────────────────────────────────────────────────────────

async function fetchJSON(url, opts = {}, attempt = 0) {
  if (attempt >= MAX_RETRIES) throw new Error('Too many attempts');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    console.warn(`[API] ${err.message} for ${url} (attempt ${attempt + 1})`);
    await new Promise((r) => setTimeout(r, (attempt + 1) * RETRY_DELAY_MS));
    return fetchJSON(url, opts, attempt + 1);
  }
}

function toFormData(obj) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v !== 'function' && v != null) fd.append(k, v);
  }
  return fd;
}

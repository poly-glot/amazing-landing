/**
 * @module ShareButtons
 * Facebook + Twitter share buttons for the voucher page.
 */

import { qs, param } from '../core/dom.js';

export class ShareButtons {
  #customer;
  #slug;
  #host;

  constructor(customer, promotionSlug, baseHost) {
    this.#customer = customer;
    this.#slug     = promotionSlug;
    this.#host     = baseHost;
  }

  enable() {
    this.#product = this.#customer.product ?? this.#customer.suggested_product() ?? 'Bloom';
    const url = this.#buildShareUrl();
    this.#setupTwitter(url);
    this.#setupFacebook(url);
  }

  #product = null;

  #buildShareUrl() {
    const country = (this.#customer.country ?? 'gb').toLowerCase();
    return `${this.#host}/share/${this.#slug}/${this.#product.toLowerCase()}/${country}`;
  }

  #setupTwitter(url) {
    const product = this.#product;
    const text = `I got ${product}, what will you get? Start your FREE Azadi 7-Day skincare trial now!`;
    const href = `https://twitter.com/intent/tweet?${param({ text, url, hashtags: 'MyBeautyStory' })}`;

    const link = qs('.share-this .social-link-twitter');
    if (link) { link.href = href; link.target = '_blank'; }

    loadSdk('script', 'twitter-wjs', 'https://platform.twitter.com/widgets.js');
  }

  #setupFacebook(url) {
    window.fbAsyncInit = () => window.FB?.init({ appId: '207959006000015', xfbml: true, version: 'v2.4' });
    loadSdk('script', 'facebook-jssdk', '//connect.facebook.net/en_US/sdk.js');

    const link = qs('.share-this .social-link-facebook');
    if (!link) return;

    link.href = `https://www.facebook.com/sharer/sharer.php?${param({ u: url })}`;
    link.target = '_blank';
    link.addEventListener('click', (e) => { e.preventDefault(); window.FB?.ui({ method: 'share', href: url }); });
  }
}

function loadSdk(tag, id, src) {
  if (document.getElementById(id)) return;
  const el = document.createElement(tag);
  el.id  = id;
  el.src = src;
  document.head.appendChild(el);
}

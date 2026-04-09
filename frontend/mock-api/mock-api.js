/**
 * Mock API — intercepts fetch() calls to API endpoints.
 *
 * Installs a global fetch wrapper that redirects API URLs to local
 * JSON files. Runs synchronously at parse time (before main.js),
 * so there is no race condition with the promotion/store boot sequence.
 *
 * Zero jQuery dependency.
 */
(function () {
  'use strict';

  // NOTE: This file is no longer loaded by any HTML page.
  // Mock API is now handled by the Vite dev server middleware (see vite.config.js).
  // This file is kept as a reference for the mock route definitions.

  var MOCK_ROUTES = [
    { match: 'api/v1/survey/stores',      file: '/mock-api/api/v1/survey/stores.json' },
    { match: 'api/v1/survey/promotion',    file: '/mock-api/api/v1/survey/promotion.json' },
    { match: 'api/v1/survey/customer',     file: '/mock-api/api/v1/survey/customer.json' },
    { match: 'api/v1/survey/updatestore',  file: '/mock-api/api/v1/survey/updatestore.json' },
    { match: 'api/v1/survey/email',        file: '/mock-api/api/v1/survey/email.json' },
    { match: 'api/v1/survey/products',    file: '/mock-api/api/v1/survey/products.json' },
    { match: 'api/v1/survey/questions',   file: '/mock-api/api/v1/survey/questions.json' },
  ];

  // ── Intercept fetch ───────────────────────────────────────────────

  var _realFetch = window.fetch;

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input.url;

    for (var i = 0; i < MOCK_ROUTES.length; i++) {
      if (url.indexOf(MOCK_ROUTES[i].match) > -1) {
        return _realFetch(MOCK_ROUTES[i].file);
      }
    }

    return _realFetch(input, init);
  };

  // ── Intercept XMLHttpRequest (for jQuery $.ajax in 2015 versions) ──

  var _RealXHR = window.XMLHttpRequest;

  window.XMLHttpRequest = function () {
    var xhr = new _RealXHR();
    var _open = xhr.open;

    xhr.open = function (method, url) {
      for (var i = 0; i < MOCK_ROUTES.length; i++) {
        if (url.indexOf(MOCK_ROUTES[i].match) > -1) {
          arguments[1] = MOCK_ROUTES[i].file;
          break;
        }
      }
      return _open.apply(xhr, arguments);
    };

    return xhr;
  };

  // Copy static properties (DONE, HEADERS_RECEIVED, etc.)
  Object.keys(_RealXHR).forEach(function (k) {
    try { window.XMLHttpRequest[k] = _RealXHR[k]; } catch (e) {}
  });
  window.XMLHttpRequest.prototype = _RealXHR.prototype;

  console.log('[Mock API] Fetch interceptor installed — all API calls use local mock data');
})();

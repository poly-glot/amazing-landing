/**
 * @module tracking
 * Google Analytics event tracking.
 */

window.ga = window.ga ?? (() => {});

export function captureTracking() {
  if (!window.MasterTmsUdo || typeof window.ga !== 'function') return;
  try {
    const udo  = window.MasterTmsUdo;
    const base = window.tracking_url ?? '/desktop/default/';
    const routes = [
      [udo.questionOneAnswer,            'question1',     'Just between us, what is your age group?', 'age_group', udo.questionOneAnswer],
      [udo.questionTwoAnswer,            'question2',     'How would you describe your skin?',        'skin',      udo.questionTwoAnswer, 1],
      [udo.questionThreeAnswer,          'question3',     'What are your 2 main skin concerns?',      'concern',   udo.questionThreeAnswer, 1],
      [udo.nearestStore,                 'store-locator', 'Store Locator'],
      [udo.questionnaireFormCompleted,   'completed',     'Questionnaire Form Completed'],
      [udo.skincareRecommendationResult, 'voucher',       'Get Your Voucher'],
    ];
    for (const [flag, page, title, ...event] of routes) {
      if (!flag) continue;
      window.ga('set', { page: base + page, title });
      window.ga('send', 'pageview');
      if (event.length) window.ga('send', 'event', ...event);
      break;
    }
  } catch { /* suppress tracking errors */ }
}

// Action menu: toggles dropdown on ··· button click
// Closes on outside click or Escape key press
// No framework, no globals, CSP-safe (loaded via <script src defer>)

function initActionMenus() {
  // Guard against double-initialization (e.g. HMR or external callers)
  if (document.documentElement.dataset.actionMenuInit) return;
  document.documentElement.dataset.actionMenuInit = '1';

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.c-action-menu__trigger');

    // Close all open menus
    document.querySelectorAll('.c-action-menu__dropdown:not([hidden])').forEach((menu) => {
      const isInsideThisMenu = menu.previousElementSibling === trigger;
      if (!isInsideThisMenu) {
        menu.hidden = true;
        menu.previousElementSibling?.setAttribute('aria-expanded', 'false');
      }
    });

    if (trigger) {
      const menu = trigger.nextElementSibling;
      if (!menu) return;
      const isOpen = !menu.hidden;
      menu.hidden = isOpen;
      trigger.setAttribute('aria-expanded', String(!isOpen));
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.c-action-menu__dropdown:not([hidden])').forEach((menu) => {
      menu.hidden = true;
      menu.previousElementSibling?.setAttribute('aria-expanded', 'false');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initActionMenus);
} else {
  initActionMenus();
}

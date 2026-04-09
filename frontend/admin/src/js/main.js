import '../css/main.css';

// Confirm delete dialogs
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-confirm]');
  if (btn) {
    const msg = btn.getAttribute('data-confirm') || 'Are you sure?';
    if (!confirm(msg)) {
      e.preventDefault();
    }
  }
});

// Auto-dismiss flash messages after 5s
document.querySelectorAll('[data-flash]').forEach((el) => {
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 5000);
});

// Mountaineer Solar - Lead Capture helpers
// - Fills hidden UTM fields on all Netlify forms
// - Captures basic page context

(function () {
  function getParams() {
    try { return new URLSearchParams(window.location.search); }
    catch (e) { return new URLSearchParams(); }
  }

  function setIfPresent(root, name, value) {
    const el = root.querySelector('input[name="' + name + '"]');
    if (el && (value !== null && value !== undefined)) el.value = String(value);
  }

  function fillForm(form) {
    const params = getParams();
    const keys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid','msclkid'];
    keys.forEach(k => setIfPresent(form, k, params.get(k) || ''));
    // page context
    setIfPresent(form, 'page', (window.location.pathname || '/').replace(/^\//,''));
    setIfPresent(form, 'referrer', document.referrer || '');
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('form[data-netlify="true"]').forEach(fillForm);
  });
})();
// Mountaineer Solar — Main JS
// Handles: UTM capture, hamburger nav, 2-step form logic, Google Sheets form submission

(function () {
  'use strict';

  // ---- URL Parameter Capture ----
  function getParams() {
    try { return new URLSearchParams(window.location.search); }
    catch (e) { return new URLSearchParams(); }
  }

  function setIfPresent(root, name, value) {
    var el = root.querySelector('input[name="' + name + '"]');
    if (el && value !== null && value !== undefined) el.value = String(value);
  }

  function fillHiddenFields(form) {
    var params = getParams();
    var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid'];
    keys.forEach(function (k) { setIfPresent(form, k, params.get(k) || ''); });
    setIfPresent(form, 'page', (window.location.pathname || '/').replace(/^\//, ''));
    setIfPresent(form, 'referrer', document.referrer || '');
  }

  // ---- Hamburger Navigation ----
  function initHamburger() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.main-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
      nav.classList.toggle('open');
    });
    // Close on link click (mobile)
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
      });
    });
  }

  // ---- 2-Step Form Logic ----
  function initStepForms() {
    document.querySelectorAll('.step-next').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var form = btn.closest('form');
        var currentStep = btn.closest('.form-step');
        var nextStepNum = btn.getAttribute('data-next');
        var nextStep = form.querySelector('.form-step[data-step="' + nextStepNum + '"]');

        // Validate current step fields
        var inputs = currentStep.querySelectorAll('input[required], select[required]');
        var valid = true;
        inputs.forEach(function (input) {
          if (!input.checkValidity()) {
            input.reportValidity();
            valid = false;
          }
        });
        if (!valid) return;

        // Calculate savings preview from the bill field
        var billInput = form.querySelector('input[name="monthly_bill"]');
        var previewEl = form.closest('.lead-card').querySelector('[id^="savingsPreview"]');
        if (billInput && previewEl && billInput.value) {
          var monthlyBill = parseFloat(billInput.value);
          var annualSavings = Math.round(monthlyBill * 12 * 0.90 * 0.13 / 0.13); // simplified: ~90% offset
          // Better estimate: annual savings = monthly bill * 12 * 0.90 (90% offset)
          annualSavings = Math.round(monthlyBill * 12 * 0.90);
          previewEl.innerHTML = '<p>Based on your info, you could save approximately</p>' +
            '<div class="preview-amount">$' + annualSavings.toLocaleString() + '/year</div>' +
            '<p>with solar on your property</p>';
        }

        // Show next step
        currentStep.classList.remove('active');
        if (nextStep) nextStep.classList.add('active');
      });
    });
  }

  // ---- Form Submission to Google Sheets ----
  function initFormSubmission() {
    document.querySelectorAll('.lead-form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validate all fields
        var inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        var valid = true;
        inputs.forEach(function (input) {
          if (!input.checkValidity()) {
            input.reportValidity();
            valid = false;
          }
        });
        if (!valid) return;

        // Check TCPA consent
        var consent = form.querySelector('input[name="tcpa_consent"]');
        if (consent && !consent.checked) {
          consent.reportValidity();
          return;
        }

        // Fill consent metadata
        var consentText = form.querySelector('.consent-text');
        var consentTimestamp = form.querySelector('input[name="consent_timestamp"]');
        var consentTextHidden = form.querySelector('input[name="consent_text"]');
        if (consentText && consentTextHidden) consentTextHidden.value = consentText.textContent.trim();
        if (consentTimestamp) consentTimestamp.value = new Date().toISOString();

        // Fill hidden fields
        fillHiddenFields(form);

        // Collect all form data
        var formData = {};
        var elements = form.elements;
        for (var i = 0; i < elements.length; i++) {
          var el = elements[i];
          if (!el.name || el.name === 'bot-field') continue;
          if (el.type === 'radio' && !el.checked) continue;
          if (el.type === 'checkbox') {
            formData[el.name] = el.checked ? 'Yes' : 'No';
          } else {
            formData[el.name] = el.value;
          }
        }

        // Add timestamp
        formData.timestamp = new Date().toISOString();

        var btn = form.querySelector('button[type="submit"]');
        var origText = btn.textContent;
        btn.textContent = 'Sending...';
        btn.disabled = true;

        // Get the form endpoint from site data (embedded in page)
        var endpoint = document.body.getAttribute('data-form-endpoint');

        if (!endpoint || endpoint === 'GOOGLE_APPS_SCRIPT_URL_HERE') {
          // Fallback: redirect directly to thank-you (for development/testing)
          console.log('Form data:', formData);
          window.location.href = '/thank-you/';
          return;
        }

        // POST to Google Apps Script
        fetch(endpoint, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }).then(function () {
          // GA4 conversion event
          if (typeof gtag === 'function') {
            gtag('event', 'generate_lead', {
              event_category: 'form',
              event_label: formData.form_name || 'lead',
              value: 1
            });
          }
          window.location.href = '/thank-you/';
        }).catch(function (err) {
          console.error('Form submission error:', err);
          btn.textContent = origText;
          btn.disabled = false;
          alert('Something went wrong. Please try again or call us directly.');
        });
      });
    });
  }

  // ---- GA4 Events ----
  function initAnalyticsEvents() {
    // Track calculator runs
    var runCalc = document.getElementById('runCalc');
    if (runCalc && typeof gtag === 'function') {
      runCalc.addEventListener('click', function () {
        gtag('event', 'calculator_run', { event_category: 'engagement' });
      });
    }

    // Track outbound clicks
    document.querySelectorAll('a[href^="http"]').forEach(function (link) {
      if (link.hostname !== window.location.hostname) {
        link.setAttribute('rel', 'noopener noreferrer');
        link.addEventListener('click', function () {
          if (typeof gtag === 'function') {
            gtag('event', 'outbound_click', { event_label: link.href });
          }
        });
      }
    });
  }

  // ---- Init ----
  document.addEventListener('DOMContentLoaded', function () {
    initHamburger();
    initStepForms();
    initFormSubmission();
    initAnalyticsEvents();

    // Fill UTM fields on all forms
    document.querySelectorAll('form').forEach(fillHiddenFields);
  });
})();

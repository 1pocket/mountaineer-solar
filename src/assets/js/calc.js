// Mountaineer Solar — Solar Savings Calculator
function fmtUSD(n) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
function fmt1(n) {
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

document.addEventListener('DOMContentLoaded', function () {
  var bill = document.getElementById('bill');
  var kwh = document.getElementById('kwh');
  var rate = document.getElementById('rate');
  var pf = document.getElementById('pf');
  var ppw = document.getElementById('ppw');
  var battKwh = document.getElementById('batteryKwh');
  var battPpkwh = document.getElementById('batteryPpkwh');
  var itc = document.getElementById('itc');

  var outSize = document.getElementById('outSize');
  var outAnnual = document.getElementById('outAnnual');
  var outOffset = document.getElementById('outOffset');
  var outCostBefore = document.getElementById('outCostBefore');
  var outCostAfter = document.getElementById('outCostAfter');
  var outBattCost = document.getElementById('outBattCost');
  var outPayback = document.getElementById('outPayback');

  var results = document.getElementById('results');
  var run = document.getElementById('runCalc');

  if (!run) return;

  // Read URL params and pre-fill inputs
  try {
    var params = new URLSearchParams(window.location.search);
    if (params.get('bill') && bill) bill.value = params.get('bill');
    if (params.get('kwh') && kwh) kwh.value = params.get('kwh');
    if (params.get('zip')) {
      var zipField = document.querySelector('input[name="zip"]');
      if (zipField) zipField.value = params.get('zip');
    }
  } catch (e) { /* URLSearchParams not supported */ }

  function calculate() {
    var mBill = parseFloat(bill.value || '0');
    var mKwh = parseFloat(kwh.value || '0');
    var r = parseFloat(rate.value || '0.13');
    var prodFactor = parseFloat(pf.value || '1200');
    var pricePerW = parseFloat(ppw.value || '2.75');
    var batteryKwhVal = parseFloat(battKwh.value || '0');
    var batteryPpkwhVal = parseFloat(battPpkwh.value || '900');
    var itcPct = parseFloat(itc.value || '0');

    if (!mKwh && mBill && r > 0) {
      mKwh = mBill / r;
    }

    var targetAnnualKwh = Math.max(0, (mKwh * 12) * 0.90);
    var sizeKw = prodFactor > 0 ? (targetAnnualKwh / prodFactor) : 0;
    sizeKw = Math.max(0, sizeKw);

    var sysWatts = sizeKw * 1000;
    var sysCostBefore = sysWatts * pricePerW;
    var batteryCost = Math.max(0, batteryKwhVal) * Math.max(0, batteryPpkwhVal);
    var itcFraction = Math.max(0, Math.min(1, itcPct / 100));
    var costAfter = (sysCostBefore + batteryCost) * (1 - itcFraction);

    var annualSavings = Math.min(targetAnnualKwh, mKwh * 12) * r;
    var paybackYrs = (annualSavings > 0) ? (costAfter / annualSavings) : Infinity;

    outSize.textContent = fmt1(sizeKw);
    outAnnual.textContent = Math.round(sizeKw * prodFactor).toLocaleString();
    outOffset.textContent = Math.round(targetAnnualKwh / 12).toLocaleString();
    outCostBefore.textContent = fmtUSD(sysCostBefore);
    outCostAfter.textContent = fmtUSD(costAfter);
    outBattCost.textContent = batteryCost ? fmtUSD(batteryCost) : '\u2014';
    outPayback.textContent = (paybackYrs === Infinity) ? '\u2014' : fmt1(paybackYrs);

    results.classList.add('visible');
    results.style.display = 'block';

    // Populate hidden fields for calculator lead form
    var leadForm = document.getElementById('calcLeadForm');
    if (leadForm) {
      var setHidden = function (name, val) {
        var el = leadForm.querySelector('input[name="' + name + '"]');
        if (el) el.value = (val != null ? val : '').toString();
      };
      setHidden('bill', mBill);
      setHidden('kwh', mKwh);
      setHidden('system_size_kw', sizeKw.toFixed(1));
      setHidden('system_cost_after_itc', Math.round(costAfter));
      setHidden('payback_years', paybackYrs === Infinity ? '' : paybackYrs.toFixed(1));
    }

    results.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Return values for use by 2-step form savings preview
    return { annualSavings: annualSavings, sizeKw: sizeKw, costAfter: costAfter, paybackYrs: paybackYrs };
  }

  run.addEventListener('click', calculate);

  // Auto-run if URL params provided bill or kwh
  try {
    var p = new URLSearchParams(window.location.search);
    if (p.get('bill') || p.get('kwh')) {
      setTimeout(calculate, 300);
    }
  } catch (e) {}
});

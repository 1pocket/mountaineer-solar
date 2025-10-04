// Client-side solar savings calculator
function fmtUSD(n){ return n.toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}); }
function fmt1(n){ return Number(n).toLocaleString(undefined,{maximumFractionDigits:1}); }

document.addEventListener('DOMContentLoaded', () => {
  const bill = document.getElementById('bill');
  const kwh = document.getElementById('kwh');
  const rate = document.getElementById('rate');
  const pf = document.getElementById('pf'); // kWh per kW-year
  const ppw = document.getElementById('ppw'); // $/W installed
  const battKwh = document.getElementById('batteryKwh');
  const battPpkwh = document.getElementById('batteryPpkwh');
  const itc = document.getElementById('itc');

  const outSize = document.getElementById('outSize');
  const outAnnual = document.getElementById('outAnnual');
  const outOffset = document.getElementById('outOffset');
  const outCostBefore = document.getElementById('outCostBefore');
  const outCostAfter = document.getElementById('outCostAfter');
  const outBattCost = document.getElementById('outBattCost');
  const outPayback = document.getElementById('outPayback');

  const results = document.getElementById('results');
  const run = document.getElementById('runCalc');

  run.addEventListener('click', () => {
    let mBill = parseFloat(bill.value || '0');
    let mKwh = parseFloat(kwh.value || '0');
    let r = parseFloat(rate.value || '0.13');
    let prodFactor = parseFloat(pf.value || '1200'); // kWh per kW DC per year
    let pricePerW = parseFloat(ppw.value || '2.75'); // $/W
    let batteryKwh = parseFloat(battKwh.value || '0');
    let batteryPpkwh = parseFloat(battPpkwh.value || '900');
    let itcPct = parseFloat(itc.value || '30');

    if (!mKwh && mBill && r > 0){
      mKwh = mBill / r; // infer usage from bill
    }

    const targetAnnualKwh = Math.max(0, (mKwh * 12) * 0.90);
    let sizeKw = prodFactor > 0 ? (targetAnnualKwh / prodFactor) : 0;
    sizeKw = Math.max(0, sizeKw);

    const sysWatts = sizeKw * 1000;
    const sysCostBefore = sysWatts * pricePerW;
    const batteryCost = Math.max(0, batteryKwh) * Math.max(0, batteryPpkwh);
    const itcFraction = Math.max(0, Math.min(1, itcPct/100));
    const costAfter = (sysCostBefore + batteryCost) * (1 - itcFraction);

    const annualSavings = Math.min(targetAnnualKwh, mKwh * 12) * r;
    const paybackYrs = (annualSavings > 0) ? (costAfter / annualSavings) : Infinity;

    outSize.textContent = fmt1(sizeKw);
    outAnnual.textContent = Math.round(sizeKw * prodFactor).toLocaleString();
    outOffset.textContent = Math.round(targetAnnualKwh/12).toLocaleString();
    outCostBefore.textContent = fmtUSD(sysCostBefore);
    outCostAfter.textContent = fmtUSD(costAfter);
    outBattCost.textContent = batteryCost ? fmtUSD(batteryCost) : '—';
    outPayback.textContent = (paybackYrs === Infinity) ? '—' : fmt1(paybackYrs);

    results.style.display = 'block';
    results.scrollIntoView({behavior:'smooth', block:'start'});
  });
});

// Chart.js loader and Bitcoin chart logic for GraphTest section
(function() {
  function loadBitcoinChart(rangeDays) {
    const canvas = document.getElementById('btcChart');
    if (!canvas) return;
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => loadBitcoinChart(rangeDays);
      document.body.appendChild(script);
      return;
    }
    fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${rangeDays}`)
      .then(res => res.json())
      .then(data => {
        const labels = data.prices.map(p => new Date(p[0]).toLocaleTimeString());
        const prices = data.prices.map(p => p[1]);
        if (window.btcChartInstance) window.btcChartInstance.destroy();
        window.btcChartInstance = new Chart(canvas.getContext('2d'), {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'BTC Price (USD)',
              data: prices,
              borderColor: '#7feaf9',
              backgroundColor: 'rgba(127,234,249,0.1)',
              fill: true,
              tension: 0.2
            }]
          },
          options: {
            responsive: false,
            plugins: { legend: { display: true } },
            scales: { x: { display: true }, y: { display: true } }
          }
        });
      });
  }

  function setupGraphTestSection() {
    const controls = document.getElementById('btcChartControls');
    if (!controls) return;
    controls.querySelectorAll('button').forEach(btn => {
      btn.onclick = function() {
        controls.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        loadBitcoinChart(this.getAttribute('data-range'));
      };
    });
    // Load default (1day)
    controls.querySelector('button[data-range="1"]').classList.add('active');
    loadBitcoinChart('1');
  }

  // Run setup when GraphTest section is loaded
  const observer = new MutationObserver(() => {
    if (document.getElementById('btcChartControls')) {
      setupGraphTestSection();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();

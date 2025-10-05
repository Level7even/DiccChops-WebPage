// Estimated Launch Day Countdown
// Run immediately since loaded dynamically
setTimeout(initCountdown, 100); // Delay to ensure DOM is ready

function initCountdown() {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1500); // 1500 days from now

  function updateCountdown() {
    const now = new Date();
    const difference = targetDate - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const daysEl = document.getElementById('days');
      const hoursEl = document.getElementById('hours');
      const minutesEl = document.getElementById('minutes');
      const secondsEl = document.getElementById('seconds');

      if (daysEl) daysEl.textContent = days.toString().padStart(3, '0');
      if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
      if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
      if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    } else {
      // Launch day reached
      const container = document.querySelector('.countdown-container');
      const message = document.querySelector('.launch-message p');
      if (container) container.innerHTML = '<div class="countdown-item"><span class="countdown-number">🚀</span><span class="countdown-label">Launched!</span></div>';
      if (message) message.textContent = 'The launch has happened! Welcome to the future.';
    }
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

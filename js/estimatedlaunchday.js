// Estimated Launch Day Countdown
// Run immediately since loaded dynamically
initCountdown();

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

      document.getElementById('days').textContent = days.toString().padStart(3, '0');
      document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
      document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
      document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    } else {
      // Launch day reached
      document.querySelector('.countdown-container').innerHTML = '<div class="countdown-item"><span class="countdown-number">🚀</span><span class="countdown-label">Launched!</span></div>';
      document.querySelector('.launch-message p').textContent = 'The launch has happened! Welcome to the future.';
    }
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

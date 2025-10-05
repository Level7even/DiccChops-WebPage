// stats.js - Handles dynamic updates for the stats page
document.addEventListener('DOMContentLoaded', () => {
  const statNumbers = document.querySelectorAll('.stat-number');

  // Simulate dynamic updates (in a real app, this would fetch from an API)
  const updateStats = () => {
    statNumbers.forEach((stat, index) => {
      const currentValue = parseInt(stat.textContent.replace(/[^\d]/g, ''));
      const increment = Math.floor(Math.random() * 10) + 1; // Random increment for demo
      const newValue = currentValue + increment;
      stat.textContent = index === 2 ? `+${newValue}%` : (index === 3 ? `$${newValue.toLocaleString()}` : newValue.toLocaleString());
    });
  };

  // Update stats every 5 seconds for demo purposes
  setInterval(updateStats, 5000);
});

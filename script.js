// Countdown Timer
function updateCountdown() {
  // Set target date (1500 days from now for demo)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1500);
  targetDate.setHours(8, 42, 30, 0); // Set specific time
  
  const now = new Date().getTime();
  const distance = targetDate.getTime() - now;
  
  if (distance > 0) {
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    document.getElementById('days').textContent = days.toString().padStart(2, '0');
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
  }
}

// Typing animation for subtitle
function typeWriter() {
  const texts = [
    "Crafting something amazing...",
    "Building the future...",
    "Innovation in progress...",
    "Almost ready to launch..."
  ];
  
  let textIndex = 0;
  let charIndex = 0;
  const typingElement = document.querySelector('.typing-text');
  
  function type() {
    if (charIndex < texts[textIndex].length) {
      typingElement.textContent = texts[textIndex].substring(0, charIndex + 1);
      charIndex++;
      setTimeout(type, 100);
    } else {
      setTimeout(() => {
        charIndex = 0;
        textIndex = (textIndex + 1) % texts.length;
        typingElement.textContent = '';
        setTimeout(type, 500);
      }, 2000);
    }
  }
  
  type();
}

// Simulate progress updates
function updateProgress() {
  const progressFill = document.querySelector('.progress-fill');
  const progressText = document.querySelector('.progress-text');
  
  let progress = 0;
  const targetProgress = 67;
  
  const interval = setInterval(() => {
    if (progress < targetProgress) {
      progress++;
      progressFill.style.width = progress + '%';
      progressText.textContent = progress + '%';
    } else {
      clearInterval(interval);
    }
  }, 50);
}

// Add glowing effect to feature cards on scroll
function animateOnScroll() {
  const cards = document.querySelectorAll('.feature-card');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
      }
    });
  });
  
  cards.forEach(card => observer.observe(card));
}

// CTA Button click effect
function handleCTAClick() {
  const ctaButton = document.getElementById('notifyBtn');
  
  ctaButton.addEventListener('click', function() {
    // Create ripple effect
    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.6)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.marginLeft = '-25px';
    ripple.style.marginTop = '-25px';
    ripple.style.width = '50px';
    ripple.style.height = '50px';
    
    this.style.position = 'relative';
    this.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
    
    // Show notification
    showNotification();
  });
}

// Show custom notification
function showNotification() {
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #00ffff, #ff0080);
      color: white;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 255, 255, 0.3);
      z-index: 1000;
      font-family: 'Orbitron', Arial, sans-serif;
      font-weight: 700;
      animation: slideIn 0.5s ease;
    ">
      <i class="fas fa-check-circle" style="margin-right: 10px;"></i>
      You'll be notified when we launch!
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.5s ease forwards';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Load header component and initialize header-related JS after it's loaded

document.addEventListener('DOMContentLoaded', function () {
   fetch('/Components/HeaderV2/HeaderV2.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('header').innerHTML = html;
    });

    // Initialize other page features
    updateCountdown();
    setInterval(updateCountdown, 1000);
    setTimeout(typeWriter, 1000);
    setTimeout(updateProgress, 2000);
    setTimeout(animateOnScroll, 1500);
    handleCTAClick();
    // Load starfield background
    const starsContainer = document.getElementById('stars-component') || document.body;
    fetch('/Components/Stars/Stars.html')
      .then(res => res.text())
      .then(html => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        document.querySelectorAll('.stars, .stars2, .stars3, .stars-bg').forEach(e => e.remove());
        Array.from(tempDiv.children).forEach(child => starsContainer.appendChild(child));
      });

});

// Version update logic (no import needed)
const versionEl = document.getElementById('version-text');
if (versionEl && window.DICCCHOPS_VERSION) {
  versionEl.textContent = `v. ${window.DICCCHOPS_VERSION}`;
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
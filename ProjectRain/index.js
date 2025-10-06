// index.js - Entry point for Project Rain

// Load CSS
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'ProjectRain/css/style.css';
document.head.appendChild(link);

// Load world.js
const script1 = document.createElement('script');
script1.src = 'ProjectRain/World/world.js';
document.body.appendChild(script1);

// Load main.js after world.js
script1.onload = () => {
    const script2 = document.createElement('script');
    script2.src = 'ProjectRain/js/main.js';
    document.body.appendChild(script2);
};

document.querySelectorAll('.load-section').forEach(link => {
  link.addEventListener('click', async e => {
    e.preventDefault();
    const file = link.dataset.file;
    const response = await fetch(file);
    const html = await response.text();
    const main = document.getElementById('main-content');
    
    // Remove previous dynamic section if exists
    const dynamicSection = main.querySelector('.dynamic');
    if(dynamicSection) dynamicSection.remove();

    // Insert new section
    const wrapper = document.createElement('div');
    wrapper.classList.add('dynamic');
    wrapper.innerHTML = html;
    main.appendChild(wrapper);

    // Scroll to section
    wrapper.scrollIntoView({ behavior: 'smooth' });
  });
});

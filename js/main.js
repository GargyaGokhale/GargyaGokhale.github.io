/* filepath: /Users/gargyagokhale/github/GargyaGokhale.github.io/js/main.js */
// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            document.querySelector('nav ul').classList.toggle('show');
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const nav = document.querySelector('nav');
        const toggle = document.querySelector('.menu-toggle');
        if (nav && toggle) {
            const isClickInsideNav = nav.contains(event.target);
            const isToggleClick = toggle.contains(event.target);
            
            if (!isClickInsideNav && !isToggleClick && document.querySelector('nav ul').classList.contains('show')) {
                document.querySelector('nav ul').classList.remove('show');
            }
        }
    });

    // Active link highlighting
    const currentLocation = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentLocation || 
            (currentLocation.includes('/blog/') && link.getAttribute('href') === '/blog.html')) {
            link.classList.add('active');
        }
    });
});
/* filepath: /Users/gargyagokhale/github/GargyaGokhale.github.io/js/animations.js */
// Animation on scroll
document.addEventListener('DOMContentLoaded', function() {
    // Animate elements when they come into view
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.section-card, .card, .publication-card, .blog-card');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (elementPosition < screenPosition) {
                element.classList.add('visible');
            }
        });
    };
    
    // Initial check
    animateOnScroll();
    
    // Check on scroll
    window.addEventListener('scroll', animateOnScroll);
});

// Add fade-in animation CSS dynamically
const style = document.createElement('style');
style.textContent = `
    .section-card, .card, .publication-card, .blog-card {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .section-card.visible, .card.visible, .publication-card.visible, .blog-card.visible {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);
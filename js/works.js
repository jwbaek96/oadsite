// Works Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initCategoryFilter();
});

// Category Filter Functionality
function initCategoryFilter() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const workCards = document.querySelectorAll('.work-card');

    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;

            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filter cards
            filterWorkCards(category, workCards);
        });
    });
}

function filterWorkCards(category, workCards) {
    workCards.forEach((card, index) => {
        const cardCategory = card.dataset.category;

        if (category === 'all' || cardCategory === category) {
            // Show card with animation delay
            setTimeout(() => {
                card.classList.remove('hidden');
                card.style.animation = 'none';
                setTimeout(() => {
                    card.style.animation = `fadeIn 0.4s ease forwards`;
                }, 10);
            }, index * 50);
        } else {
            // Hide card
            card.classList.add('hidden');
        }
    });
}

// Smooth scroll to top when clicking work cards (optional)
function initSmoothScroll() {
    const workCardLinks = document.querySelectorAll('.work-card-link');

    workCardLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // If link is just "#", prevent default and scroll to top
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize smooth scroll
initSmoothScroll();

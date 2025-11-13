// Component Loader - Load reusable components (footer, header, etc.)
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Components.js loaded');
    loadMobileHeader();
    loadMobileMenuOverlay();
    loadSidebar();
    loadFooter();
});

// Load Mobile Header Component
function loadMobileHeader() {
    const container = document.getElementById('mobile-header-container');
    if (!container) return;
    
    fetch('templates/mobile-header.html')
        .then(response => response.text())
        .then(html => {
            const cleanedHtml = html.replace(/<script[^>]*>[\s\S]*?live-server[\s\S]*?<\/script>/gi, '');
            container.innerHTML = cleanedHtml;
            console.log('✅ Mobile header loaded');
        })
        .catch(error => console.error('❌ Error loading mobile header:', error));
}

// Load Mobile Menu Overlay Component
function loadMobileMenuOverlay() {
    const container = document.getElementById('mobile-menu-overlay-container');
    if (!container) return;
    
    fetch('templates/mobile-menu-overlay.html')
        .then(response => response.text())
        .then(html => {
            const cleanedHtml = html.replace(/<script[^>]*>[\s\S]*?live-server[\s\S]*?<\/script>/gi, '');
            container.innerHTML = cleanedHtml;
            console.log('✅ Mobile menu overlay loaded');
            
            // Initialize mobile menu handlers after loading
            initializeMobileMenu();
        })
        .catch(error => console.error('❌ Error loading mobile menu overlay:', error));
}

// Load Sidebar Component
function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    
    fetch('templates/sidebar.html')
        .then(response => response.text())
        .then(html => {
            const cleanedHtml = html.replace(/<script[^>]*>[\s\S]*?live-server[\s\S]*?<\/script>/gi, '');
            container.innerHTML = cleanedHtml;
            console.log('✅ Sidebar loaded');
            
            // Set active page after loading
            setActivePage();
        })
        .catch(error => console.error('❌ Error loading sidebar:', error));
}

// Load Footer Component
function loadFooter() {
    const footerContainer = document.getElementById('footer-container');
    
    if (!footerContainer) {
        console.log('❌ Footer container not found');
        return;
    }

    console.log('📦 Loading footer...');

    fetch('templates/footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // Remove live-server injected scripts that break HTML structure
            const cleanedHtml = html.replace(/<script[^>]*>[\s\S]*?live-server[\s\S]*?<\/script>/gi, '');
            console.log('✅ Footer loaded and cleaned');
            footerContainer.innerHTML = cleanedHtml;
        })
        .catch(error => {
            console.error('❌ Error loading footer:', error);
        });
}

// Initialize mobile menu handlers
function initializeMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const menuClose = document.querySelector('.mobile-menu-close');
    const menuOverlay = document.querySelector('.mobile-menu-overlay');
    
    if (menuToggle && menuOverlay) {
        menuToggle.addEventListener('click', () => {
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (menuClose && menuOverlay) {
        menuClose.addEventListener('click', () => {
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Close on overlay click
    if (menuOverlay) {
        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) {
                menuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Set active page based on current URL
function setActivePage() {
    const currentPage = getCurrentPage();
    const navItems = document.querySelectorAll('.nav-item');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
    
    navItems.forEach(item => {
        if (item.dataset.page === currentPage) {
            item.classList.add('active');
        }
    });
    
    mobileMenuLinks.forEach(link => {
        if (link.dataset.page === currentPage) {
            link.classList.add('active');
        }
    });
}

// Get current page name from URL
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'index';
    return page === 'index' ? 'home' : page;
}

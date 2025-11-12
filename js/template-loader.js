// Template Loader - Dynamic Header and Footer Loading

document.addEventListener('DOMContentLoaded', function() {
    loadTemplates();
});

// Load header and footer templates
async function loadTemplates() {
    try {
        // Load header
        await loadTemplate('templates/header.html', 'header-container', 'sidebar-container');
        
        // Load footer
        await loadTemplate('templates/footer.html', 'footer-container');
        
        // Set active page after templates are loaded
        setActivePage();
        
        // Reinitialize mobile menu after header is loaded
        if (typeof initializeMobileMenu === 'function') {
            initializeMobileMenu();
        }
    } catch (error) {
        console.error('Error loading templates:', error);
    }
}

// Load a single template
async function loadTemplate(templatePath, ...containerIds) {
    try {
        const response = await fetch(templatePath);
        
        if (!response.ok) {
            throw new Error(`Failed to load ${templatePath}: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Create a temporary div to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // For header template, split mobile header and sidebar
        if (templatePath.includes('header.html')) {
            // Get mobile header (header + mobile menu overlay)
            const mobileHeader = tempDiv.querySelector('.mobile-header');
            const mobileMenuOverlay = tempDiv.querySelector('.mobile-menu-overlay');
            const sidebar = tempDiv.querySelector('.sidebar');
            
            // Insert mobile header into first container
            if (containerIds[0] && mobileHeader) {
                const headerContainer = document.getElementById(containerIds[0]);
                if (headerContainer) {
                    headerContainer.appendChild(mobileHeader.cloneNode(true));
                    if (mobileMenuOverlay) {
                        headerContainer.appendChild(mobileMenuOverlay.cloneNode(true));
                    }
                }
            }
            
            // Insert sidebar into second container
            if (containerIds[1] && sidebar) {
                const sidebarContainer = document.getElementById(containerIds[1]);
                if (sidebarContainer) {
                    sidebarContainer.appendChild(sidebar.cloneNode(true));
                }
            }
        } else {
            // For footer and other templates, insert as is
            const container = document.getElementById(containerIds[0]);
            if (container) {
                container.innerHTML = html;
            }
        }
        
    } catch (error) {
        console.error(`Error loading template from ${templatePath}:`, error);
        throw error;
    }
}

// Set active page based on current URL
function setActivePage() {
    const currentPage = getCurrentPage();
    
    // Set active class on desktop navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const page = item.dataset.page;
        if (page === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Set active class on mobile navigation
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
    mobileMenuLinks.forEach(link => {
        const page = link.dataset.page;
        if (page === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Get current page from URL
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'index';
    
    // Map page names to nav data-page values
    const pageMap = {
        'index': 'home',
        '': 'home',
        'about': 'about',
        'works': 'works',
        'story': 'story',
        'contact': 'contact'
        // 'notice': 'notice'
    };
    
    return pageMap[page] || 'home';
}

// Initialize mobile menu (call this after header is loaded)
function initializeMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const body = document.body;

    if (mobileMenuToggle && mobileMenuOverlay) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuOverlay.classList.add('active');
            body.style.overflow = 'hidden';
        });
    }

    if (mobileMenuClose && mobileMenuOverlay) {
        mobileMenuClose.addEventListener('click', () => {
            mobileMenuOverlay.classList.remove('active');
            body.style.overflow = '';
        });
    }

    // Close menu when clicking outside
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', (e) => {
            if (e.target === mobileMenuOverlay) {
                mobileMenuOverlay.classList.remove('active');
                body.style.overflow = '';
            }
        });
    }
}

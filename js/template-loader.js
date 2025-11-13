// Template Loader - Dynamic Header and Footer Loading

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Template Loader: DOMContentLoaded fired');
    loadTemplates();
});

// Load header and footer templates
async function loadTemplates() {
    console.log('📦 Starting template loading...');
    try {
        // Load header
        console.log('🔄 Loading header template...');
        await loadTemplate('templates/header.html', 'header-container', 'sidebar-container');
        console.log('✅ Header template loaded successfully');
        
        // Load footer
        console.log('🔄 Loading footer template...');
        await loadTemplate('templates/footer.html', 'footer-container');
        console.log('✅ Footer template loaded successfully');
        
        // Set active page after templates are loaded
        console.log('🎯 Setting active page...');
        setActivePage();
        console.log('✅ Active page set');
        
        // Reinitialize mobile menu after header is loaded
        if (typeof initializeMobileMenu === 'function') {
            console.log('📱 Initializing mobile menu...');
            initializeMobileMenu();
            console.log('✅ Mobile menu initialized');
        }
        
        console.log('🎉 All templates loaded successfully!');
    } catch (error) {
        console.error('❌ Error loading templates:', error);
    }
}

// Load a single template
async function loadTemplate(templatePath, ...containerIds) {
    console.log(`📂 Loading template: ${templatePath}`);
    console.log(`📦 Target containers:`, containerIds);
    
    try {
        const response = await fetch(templatePath);
        console.log(`🌐 Fetch response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load ${templatePath}: ${response.status}`);
        }
        
        const html = await response.text();
        console.log(`📄 Template HTML loaded, length: ${html.length} characters`);
        
        // Create a temporary div to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // For header template, split mobile header and sidebar
        if (templatePath.includes('header.html')) {
            console.log('🔍 Processing header template...');
            
            // Get mobile header (header + mobile menu overlay)
            const mobileHeader = tempDiv.querySelector('.mobile-header');
            const mobileMenuOverlay = tempDiv.querySelector('.mobile-menu-overlay');
            const sidebar = tempDiv.querySelector('.sidebar');
            
            console.log('📱 Mobile header found:', !!mobileHeader);
            console.log('📱 Mobile menu overlay found:', !!mobileMenuOverlay);
            console.log('🎛️ Sidebar found:', !!sidebar);
            
            // Insert mobile header into first container
            if (containerIds[0] && mobileHeader) {
                const headerContainer = document.getElementById(containerIds[0]);
                console.log(`📍 Header container (${containerIds[0]}) found:`, !!headerContainer);
                
                if (headerContainer) {
                    headerContainer.appendChild(mobileHeader.cloneNode(true));
                    if (mobileMenuOverlay) {
                        headerContainer.appendChild(mobileMenuOverlay.cloneNode(true));
                    }
                    console.log('✅ Mobile header inserted into', containerIds[0]);
                }
            }
            
            // Insert sidebar into second container
            if (containerIds[1] && sidebar) {
                const sidebarContainer = document.getElementById(containerIds[1]);
                console.log(`📍 Sidebar container (${containerIds[1]}) found:`, !!sidebarContainer);
                
                if (sidebarContainer) {
                    sidebarContainer.appendChild(sidebar.cloneNode(true));
                    console.log('✅ Sidebar inserted into', containerIds[1]);
                }
            }
        } else {
            console.log('🔍 Processing non-header template...');
            // For footer and other templates, insert as is
            const container = document.getElementById(containerIds[0]);
            console.log(`📍 Container (${containerIds[0]}) found:`, !!container);
            
            if (container) {
                container.innerHTML = html;
                console.log('✅ Template inserted into', containerIds[0]);
            } else {
                console.warn(`⚠️ Container ${containerIds[0]} not found in DOM`);
            }
        }
        
    } catch (error) {
        console.error(`❌ Error loading template from ${templatePath}:`, error);
        throw error;
    }
}

// Set active page based on current URL
function setActivePage() {
    const currentPage = getCurrentPage();
    console.log(`🎯 Current page identified as: ${currentPage}`);
    
    // Set active class on desktop navigation
    const navItems = document.querySelectorAll('.nav-item');
    console.log(`🔍 Found ${navItems.length} nav items`);
    
    navItems.forEach(item => {
        const page = item.dataset.page;
        if (page === currentPage) {
            item.classList.add('active');
            console.log(`✅ Set active: nav-item[data-page="${page}"]`);
        } else {
            item.classList.remove('active');
        }
    });
    
    // Set active class on mobile navigation
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
    console.log(`🔍 Found ${mobileMenuLinks.length} mobile menu links`);
    
    mobileMenuLinks.forEach(link => {
        const page = link.dataset.page;
        if (page === currentPage) {
            link.classList.add('active');
            console.log(`✅ Set active: mobile-menu-link[data-page="${page}"]`);
        } else {
            link.classList.remove('active');
        }
    });
}

// Get current page from URL
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'index';
    
    console.log(`📍 URL path: ${path}`);
    console.log(`📄 Page name extracted: ${page}`);
    
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
    
    const mappedPage = pageMap[page] || 'home';
    console.log(`🗺️ Mapped to: ${mappedPage}`);
    
    return mappedPage;
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

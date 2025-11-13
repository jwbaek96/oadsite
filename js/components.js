// Component Loader - Load reusable components (footer, header, etc.)
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Components.js loaded');
    loadFooter();
});

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

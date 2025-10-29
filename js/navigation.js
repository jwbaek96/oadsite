/**
 * 전역 네비게이션 및 헤더 JavaScript
 * OA Design Studio - 오에이디자인스튜디오
 */

/**
 * 전역 네비게이션 관리자
 */
class GlobalNavigation {
    constructor() {
        this.isMenuOpen = false;
        this.scrollPosition = 0;
        this.isScrolled = false;
        this.currentTheme = 'light';
        
        this.init();
    }
    
    /**
     * 초기화
     */
    init() {
        this.setupMobileMenu();
        this.setupScrollHeader();
        this.setupThemeToggle();
        this.setupNavigation();
        this.setupSearch();
        this.loadTheme();
        this.updateCurrentPage();
        
        Utils.log.info('전역 네비게이션 초기화 완료');
    }
    
    /**
     * 모바일 메뉴 설정
     */
    setupMobileMenu() {
        const menuToggle = $('#mobile-menu-toggle');
        const mobileMenu = $('#mobile-menu');
        const menuOverlay = $('#menu-overlay');
        
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
        
        if (menuOverlay) {
            menuOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }
        
        // 메뉴 링크 클릭 시 메뉴 닫기
        const mobileMenuLinks = $$('#mobile-menu a');
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });
        
        // ESC 키로 메뉴 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }
    
    /**
     * 스크롤 헤더 설정
     */
    setupScrollHeader() {
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', Utils.event.throttle(() => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const header = $('#site-header');
            
            if (!header) return;
            
            // 스크롤 방향 감지
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // 아래로 스크롤 - 헤더 숨김
                header.classList.add('header-hidden');
            } else {
                // 위로 스크롤 - 헤더 표시
                header.classList.remove('header-hidden');
            }
            
            // 스크롤된 상태 클래스 추가/제거
            if (scrollTop > 50) {
                header.classList.add('scrolled');
                this.isScrolled = true;
            } else {
                header.classList.remove('scrolled');
                this.isScrolled = false;
            }
            
            lastScrollTop = scrollTop;
            this.scrollPosition = scrollTop;
            
        }, 100));
    }
    
    /**
     * 테마 토글 설정
     */
    setupThemeToggle() {
        const themeToggle = $('#theme-toggle');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // 시스템 테마 변경 감지
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                if (CONFIG.THEME.AUTO_DETECT_SYSTEM_THEME) {
                    this.applySystemTheme();
                }
            });
        }
    }
    
    /**
     * 네비게이션 설정
     */
    setupNavigation() {
        // 현재 페이지 하이라이트
        const currentPage = Utils.url.getCurrentPage();
        const navLinks = $$('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const linkPage = href.split('.')[0].replace('/', '');
                if (linkPage === currentPage || (currentPage === 'index' && linkPage === '')) {
                    link.classList.add('active');
                }
            }
        });
        
        // 부드러운 앵커 스크롤
        const anchorLinks = $$('a[href^="#"]');
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href').substring(1);
                const target = $(`#${targetId}`);
                
                if (target) {
                    e.preventDefault();
                    Utils.dom.smoothScrollTo(target, 80);
                    
                    // URL 업데이트
                    history.pushState(null, null, `#${targetId}`);
                }
            });
        });
        
        // 뒤로가기/앞으로가기 처리
        window.addEventListener('popstate', () => {
            const hash = window.location.hash;
            if (hash) {
                const target = $(hash);
                if (target) {
                    Utils.dom.smoothScrollTo(target, 80);
                }
            }
        });
    }
    
    /**
     * 검색 설정
     */
    setupSearch() {
        const searchToggle = $('#search-toggle');
        const searchModal = $('#search-modal');
        const searchInput = $('#global-search-input');
        const searchClose = $('#search-close');
        
        if (searchToggle) {
            searchToggle.addEventListener('click', () => {
                this.openSearchModal();
            });
        }
        
        if (searchClose) {
            searchClose.addEventListener('click', () => {
                this.closeSearchModal();
            });
        }
        
        if (searchModal) {
            searchModal.addEventListener('click', (e) => {
                if (e.target === searchModal) {
                    this.closeSearchModal();
                }
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', Utils.event.debounce((e) => {
                this.performSearch(e.target.value);
            }, CONFIG.SEARCH.DEBOUNCE_DELAY));
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.redirectToSearch(e.target.value);
                }
            });
        }
        
        // 키보드 단축키 (Ctrl+K 또는 Cmd+K)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearchModal();
            }
        });
    }
    
    /**
     * 모바일 메뉴 토글
     */
    toggleMobileMenu() {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }
    
    /**
     * 모바일 메뉴 열기
     */
    openMobileMenu() {
        const mobileMenu = $('#mobile-menu');
        const menuOverlay = $('#menu-overlay');
        const menuToggle = $('#mobile-menu-toggle');
        
        if (mobileMenu) mobileMenu.classList.add('open');
        if (menuOverlay) menuOverlay.classList.add('active');
        if (menuToggle) menuToggle.classList.add('active');
        
        document.body.classList.add('menu-open');
        this.isMenuOpen = true;
    }
    
    /**
     * 모바일 메뉴 닫기
     */
    closeMobileMenu() {
        const mobileMenu = $('#mobile-menu');
        const menuOverlay = $('#menu-overlay');
        const menuToggle = $('#mobile-menu-toggle');
        
        if (mobileMenu) mobileMenu.classList.remove('open');
        if (menuOverlay) menuOverlay.classList.remove('active');
        if (menuToggle) menuToggle.classList.remove('active');
        
        document.body.classList.remove('menu-open');
        this.isMenuOpen = false;
    }
    
    /**
     * 테마 토글
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        this.saveTheme();
    }
    
    /**
     * 테마 적용
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        const themeToggle = $('#theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'icon-sun' : 'icon-moon';
            }
        }
        
        // 메타 테마 컬러 업데이트
        const metaThemeColor = $('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#ffffff');
        }
        
        this.currentTheme = theme;
        
        // 테마 변경 이벤트 발생
        const event = new CustomEvent('themeChange', { detail: { theme } });
        document.dispatchEvent(event);
    }
    
    /**
     * 시스템 테마 적용
     */
    applySystemTheme() {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        this.applyTheme(systemTheme);
    }
    
    /**
     * 테마 저장
     */
    saveTheme() {
        Utils.storage.set('preferred_theme', this.currentTheme);
    }
    
    /**
     * 테마 로드
     */
    loadTheme() {
        const savedTheme = Utils.storage.get('preferred_theme');
        
        if (savedTheme) {
            this.applyTheme(savedTheme);
        } else if (CONFIG.THEME.AUTO_DETECT_SYSTEM_THEME) {
            this.applySystemTheme();
        } else {
            this.applyTheme(CONFIG.THEME.DEFAULT_MODE);
        }
    }
    
    /**
     * 검색 모달 열기
     */
    openSearchModal() {
        const searchModal = $('#search-modal');
        const searchInput = $('#global-search-input');
        
        if (searchModal) {
            searchModal.style.display = 'flex';
            document.body.classList.add('search-modal-open');
            
            if (searchInput) {
                setTimeout(() => {
                    searchInput.focus();
                }, 100);
            }
        }
    }
    
    /**
     * 검색 모달 닫기
     */
    closeSearchModal() {
        const searchModal = $('#search-modal');
        const searchInput = $('#global-search-input');
        const searchResults = $('#search-results');
        
        if (searchModal) {
            searchModal.style.display = 'none';
            document.body.classList.remove('search-modal-open');
        }
        
        if (searchInput) {
            searchInput.value = '';
        }
        
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }
    
    /**
     * 검색 수행
     */
    async performSearch(query) {
        const searchResults = $('#search-results');
        
        if (!searchResults) return;
        
        if (query.length < CONFIG.SEARCH.MIN_QUERY_LENGTH) {
            searchResults.innerHTML = '';
            return;
        }
        
        // 로딩 표시
        searchResults.innerHTML = '<div class="search-loading">검색 중...</div>';
        
        try {
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.SEARCH, {
                method: 'GET',
                data: { query, type: 'all' }
            });
            
            if (response.success) {
                this.renderSearchResults(response.data);
            } else {
                searchResults.innerHTML = '<div class="search-error">검색에 실패했습니다.</div>';
            }
            
        } catch (error) {
            Utils.log.error('검색 오류:', error);
            searchResults.innerHTML = '<div class="search-error">검색 중 오류가 발생했습니다.</div>';
        }
    }
    
    /**
     * 검색 결과 렌더링
     */
    renderSearchResults(data) {
        const searchResults = $('#search-results');
        if (!searchResults) return;
        
        if (data.results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">검색 결과가 없습니다.</div>';
            return;
        }
        
        const resultsHtml = data.results.map(item => {
            const itemType = item.type === 'post' ? '포스트' : '아트워크';
            const url = item.type === 'post' ? `post.html?id=${item.id}` : `artwork.html#${item.id}`;
            const date = Utils.date.format(item.createdAt, 'YYYY.MM.DD');
            
            return `
                <div class="search-result-item" onclick="globalNav.redirectToResult('${url}')">
                    <div class="search-result-type">${itemType}</div>
                    <h4 class="search-result-title">${Utils.string.highlight(item.title, data.query)}</h4>
                    <p class="search-result-excerpt">
                        ${Utils.string.highlight(Utils.string.truncate(item.excerpt || item.description || '', 100), data.query)}
                    </p>
                    <div class="search-result-meta">
                        <span class="search-result-date">${date}</span>
                        ${item.category ? `<span class="search-result-category">${item.category}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        searchResults.innerHTML = `
            <div class="search-results-header">
                <span class="search-results-count">${data.total}개의 결과</span>
                <a href="blog.html?search=${encodeURIComponent(data.query)}" class="search-view-all">
                    모든 결과 보기
                </a>
            </div>
            <div class="search-results-list">
                ${resultsHtml}
            </div>
        `;
    }
    
    /**
     * 검색 결과로 이동
     */
    redirectToResult(url) {
        this.closeSearchModal();
        window.location.href = url;
    }
    
    /**
     * 검색 페이지로 이동
     */
    redirectToSearch(query) {
        this.closeSearchModal();
        window.location.href = `blog.html?search=${encodeURIComponent(query)}`;
    }
    
    /**
     * 현재 페이지 업데이트
     */
    updateCurrentPage() {
        const currentPage = Utils.url.getCurrentPage();
        document.body.setAttribute('data-page', currentPage);
        
        // 페이지별 특별한 처리
        switch (currentPage) {
            case 'index':
                this.setupHomePage();
                break;
            case 'blog':
                this.setupBlogPage();
                break;
            case 'post':
                this.setupPostPage();
                break;
            case 'editor':
                this.setupEditorPage();
                break;
            case 'artwork':
                this.setupArtworkPage();
                break;
        }
    }
    
    /**
     * 홈페이지 특별 설정
     */
    setupHomePage() {
        // 홈페이지 특별한 헤더 처리
        const header = $('#site-header');
        if (header && this.scrollPosition < 100) {
            header.classList.add('transparent');
        }
    }
    
    /**
     * 블로그 페이지 특별 설정
     */
    setupBlogPage() {
        // 블로그 페이지 검색 연동
        const searchParam = Utils.url.getParam('search');
        if (searchParam) {
            const globalSearchInput = $('#global-search-input');
            if (globalSearchInput) {
                globalSearchInput.value = searchParam;
            }
        }
    }
    
    /**
     * 포스트 페이지 특별 설정
     */
    setupPostPage() {
        // 읽기 진행률 표시
        this.setupReadingProgress();
    }
    
    /**
     * 에디터 페이지 특별 설정
     */
    setupEditorPage() {
        // 에디터 모드 클래스 추가
        document.body.classList.add('editor-mode');
    }
    
    /**
     * 아트워크 페이지 특별 설정
     */
    setupArtworkPage() {
        // 아트워크 갤러리 모드
        document.body.classList.add('gallery-mode');
    }
    
    /**
     * 읽기 진행률 설정
     */
    setupReadingProgress() {
        const progressBar = $('#reading-progress');
        if (!progressBar) return;
        
        window.addEventListener('scroll', Utils.event.throttle(() => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.body.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            
            progressBar.style.width = `${Math.min(progress, 100)}%`;
        }, 50));
    }
    
    /**
     * 상단으로 스크롤 버튼
     */
    setupBackToTop() {
        const backToTopBtn = $('#back-to-top');
        
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
            
            // 스크롤 위치에 따라 버튼 표시/숨김
            window.addEventListener('scroll', Utils.event.throttle(() => {
                const scrollTop = window.pageYOffset;
                backToTopBtn.style.display = scrollTop > 300 ? 'block' : 'none';
            }, 100));
        }
    }
    
    /**
     * 브레드크럼 업데이트
     */
    updateBreadcrumb() {
        const breadcrumb = $('#breadcrumb');
        if (!breadcrumb) return;
        
        const currentPage = Utils.url.getCurrentPage();
        const pageTitle = document.title.split(' - ')[0];
        
        let breadcrumbItems = [
            { name: '홈', url: '/' }
        ];
        
        switch (currentPage) {
            case 'blog':
                breadcrumbItems.push({ name: '블로그', url: '/blog.html' });
                break;
            case 'post':
                breadcrumbItems.push({ name: '블로그', url: '/blog.html' });
                breadcrumbItems.push({ name: pageTitle, url: '' });
                break;
            case 'artwork':
                breadcrumbItems.push({ name: '아트워크', url: '/artwork.html' });
                break;
            case 'editor':
                breadcrumbItems.push({ name: '에디터', url: '' });
                break;
        }
        
        const breadcrumbHtml = breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            return isLast ? 
                `<span class="breadcrumb-current">${item.name}</span>` :
                `<a href="${item.url}" class="breadcrumb-link">${item.name}</a>`;
        }).join('<span class="breadcrumb-separator">></span>');
        
        breadcrumb.innerHTML = breadcrumbHtml;
    }
    
    /**
     * 알림 표시
     */
    showNotification(message, type = 'info', duration = 5000) {
        const notification = Utils.dom.create('div', {
            className: `global-notification notification-${type}`,
            innerHTML: `
                <div class="notification-content">
                    <span class="notification-message">${message}</span>
                    <button class="notification-close">&times;</button>
                </div>
            `
        });
        
        document.body.appendChild(notification);
        
        // 닫기 버튼 이벤트
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // 자동 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
        
        // 애니메이션
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    }
}

// 전역 네비게이션 인스턴스 생성
window.globalNav = new GlobalNavigation();

// 페이지 로드 완료 후 추가 설정
document.addEventListener('DOMContentLoaded', () => {
    // 상단으로 스크롤 버튼 설정
    globalNav.setupBackToTop();
    
    // 브레드크럼 업데이트
    globalNav.updateBreadcrumb();
    
    // 외부 링크 처리
    const externalLinks = $$('a[href^="http"]:not([href*="' + window.location.hostname + '"])');
    externalLinks.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
    
    // 인쇄 스타일 최적화
    window.addEventListener('beforeprint', () => {
        document.body.classList.add('printing');
    });
    
    window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing');
    });
});
/**
 * 블로그 목록 페이지 JavaScript
 * OA Design Studio - 오에이디자인스튜디오
 */

class BlogPage {
    constructor() {
        this.posts = [];
        this.filteredPosts = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.searchQuery = '';
        this.selectedCategory = '';
        this.selectedTag = '';
        this.isLoading = false;
        
        this.init();
    }
    
    /**
     * 초기화
     */
    async init() {
        try {
            this.setupEventListeners();
            this.loadFiltersFromURL();
            await this.loadPosts();
            
            Utils.log.info('블로그 페이지 초기화 완료');
        } catch (error) {
            Utils.log.error('블로그 페이지 초기화 오류:', error);
            this.showError('포스트를 불러오는데 실패했습니다.');
        }
    }
    
    /**
     * URL에서 필터 정보 로드
     */
    loadFiltersFromURL() {
        this.searchQuery = Utils.url.getParam('search') || '';
        this.selectedCategory = Utils.url.getParam('category') || '';
        this.selectedTag = Utils.url.getParam('tag') || '';
        this.currentPage = parseInt(Utils.url.getParam('page')) || 1;
        
        // UI 업데이트
        const searchInput = $('#search-input');
        if (searchInput) searchInput.value = this.searchQuery;
        
        const categoryFilter = $('#category-filter');
        if (categoryFilter) categoryFilter.value = this.selectedCategory;
        
        // 태그 버튼 활성화
        if (this.selectedTag) {
            const tagBtn = $(`.tag-btn[data-tag="${this.selectedTag}"]`);
            if (tagBtn) tagBtn.classList.add('active');
        }
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 검색 입력
        const searchInput = $('#search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.event.debounce((e) => {
                this.handleSearch(e.target.value);
            }, CONFIG.SEARCH.DEBOUNCE_DELAY));
        }
        
        // 검색 버튼
        const searchBtn = $('#search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.handleSearch(searchInput.value);
            });
        }
        
        // 검색 폼
        const searchForm = $('#search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch(searchInput.value);
            });
        }
        
        // 카테고리 필터
        const categoryFilter = $('#category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.handleCategoryFilter(e.target.value);
            });
        }
        
        // 태그 버튼들
        const tagButtons = $$('.tag-btn');
        tagButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                this.handleTagFilter(tag);
            });
        });
        
        // 정렬 옵션
        const sortSelect = $('#sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.handleSort(e.target.value);
            });
        }
        
        // 뷰 토글 (그리드/리스트)
        const viewToggle = $$('.view-toggle-btn');
        viewToggle.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.handleViewToggle(view);
            });
        });
        
        // 필터 초기화
        const clearFiltersBtn = $('#clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
        
        // 스크롤 이벤트 (상단으로 버튼)
        window.addEventListener('scroll', Utils.event.throttle(() => {
            this.handleScroll();
        }, 100));
    }
    
    /**
     * 포스트 로드
     */
    async loadPosts() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const params = {
                page: this.currentPage,
                limit: CONFIG.BLOG.POSTS_PER_PAGE,
                search: this.searchQuery,
                category: this.selectedCategory,
                tag: this.selectedTag
            };
            
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.GET_POSTS, {
                method: 'GET',
                data: params
            });
            
            if (response.success) {
                this.posts = response.data.posts;
                this.filteredPosts = [...this.posts];
                this.totalPages = response.data.pagination.pages;
                
                this.renderPosts();
                this.renderPagination(response.data.pagination);
                this.updateURL();
                
                // 검색 결과 요약
                this.updateResultsSummary(response.data.pagination);
                
            } else {
                throw new Error(response.message);
            }
            
        } catch (error) {
            Utils.log.error('포스트 로드 실패:', error);
            this.showError('포스트를 불러오는데 실패했습니다.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    /**
     * 포스트 렌더링
     */
    renderPosts() {
        const container = $('#posts-container');
        if (!container) return;
        
        if (this.posts.length === 0) {
            container.innerHTML = `
                <div class="no-posts">
                    <h3>표시할 포스트가 없습니다</h3>
                    <p>다른 검색 조건을 시도해보세요.</p>
                    <button class="btn btn-primary" onclick="blogPage.clearFilters()">
                        필터 초기화
                    </button>
                </div>
            `;
            return;
        }
        
        const currentView = this.getCurrentView();
        const postsHtml = this.posts.map(post => 
            this.createPostCard(post, currentView)
        ).join('');
        
        container.innerHTML = postsHtml;
        
        // 포스트 카드 클릭 이벤트
        container.addEventListener('click', (e) => {
            const postCard = e.target.closest('.post-card');
            if (postCard && !e.target.closest('.post-actions')) {
                const postId = postCard.dataset.postId;
                window.location.href = `post.html?id=${postId}`;
            }
        });
        
        // 페이드 인 애니메이션
        this.animatePostCards();
    }
    
    /**
     * 포스트 카드 HTML 생성
     */
    createPostCard(post, view = 'grid') {
        const formattedDate = Utils.date.format(post.createdAt, 'YYYY년 MM월 DD일');
        const timeAgo = Utils.date.timeAgo(post.createdAt);
        
        const baseCard = `
            <article class="post-card ${view}-view" data-post-id="${post.id}">
                <div class="post-thumbnail">
                    <img src="${post.thumbnail || '/assets/images/default-post.jpg'}" 
                         alt="${post.title}" loading="lazy">
                    <div class="post-meta-overlay">
                        <span class="post-category">${post.category}</span>
                        ${post.featured ? '<span class="featured-badge">추천</span>' : ''}
                    </div>
                </div>
                <div class="post-content">
                    <h3 class="post-title">${post.title}</h3>
                    <p class="post-excerpt">${post.excerpt}</p>
                    <div class="post-meta">
                        <div class="post-author">
                            <img src="/assets/images/default-avatar.jpg" alt="${post.author}" class="author-avatar">
                            <span class="author-name">by ${post.author}</span>
                        </div>
                        <div class="post-stats">
                            <span class="post-date" title="${formattedDate}">${timeAgo}</span>
                            <span class="view-count">
                                <i class="icon-eye"></i> ${post.viewCount}
                            </span>
                            <span class="comment-count">
                                <i class="icon-comment"></i> ${post.commentCount}
                            </span>
                        </div>
                    </div>
                    <div class="post-tags">
                        ${post.tags.map(tag => `
                            <span class="tag" onclick="blogPage.handleTagFilter('${tag}')">${tag}</span>
                        `).join('')}
                    </div>
                    ${Auth.canWrite() ? this.createPostActions(post) : ''}
                </div>
            </article>
        `;
        
        return baseCard;
    }
    
    /**
     * 포스트 액션 버튼 생성
     */
    createPostActions(post) {
        return `
            <div class="post-actions">
                <button class="btn btn-sm btn-outline" onclick="blogPage.editPost('${post.id}')">
                    <i class="icon-edit"></i> 수정
                </button>
                <button class="btn btn-sm btn-outline btn-danger" onclick="blogPage.deletePost('${post.id}')">
                    <i class="icon-trash"></i> 삭제
                </button>
            </div>
        `;
    }
    
    /**
     * 페이지네이션 렌더링
     */
    renderPagination(pagination) {
        const container = $('#pagination-container');
        if (!container || pagination.pages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }
        
        let paginationHtml = '<div class="pagination">';
        
        // 이전 페이지
        if (pagination.hasPrev) {
            paginationHtml += `
                <button class="page-btn" onclick="blogPage.goToPage(${pagination.page - 1})">
                    <i class="icon-arrow-left"></i> 이전
                </button>
            `;
        }
        
        // 페이지 번호들
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);
        
        if (startPage > 1) {
            paginationHtml += `<button class="page-btn" onclick="blogPage.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHtml += '<span class="page-ellipsis">...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button class="page-btn ${i === pagination.page ? 'active' : ''}" 
                        onclick="blogPage.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < pagination.pages) {
            if (endPage < pagination.pages - 1) {
                paginationHtml += '<span class="page-ellipsis">...</span>';
            }
            paginationHtml += `
                <button class="page-btn" onclick="blogPage.goToPage(${pagination.pages})">
                    ${pagination.pages}
                </button>
            `;
        }
        
        // 다음 페이지
        if (pagination.hasNext) {
            paginationHtml += `
                <button class="page-btn" onclick="blogPage.goToPage(${pagination.page + 1})">
                    다음 <i class="icon-arrow-right"></i>
                </button>
            `;
        }
        
        paginationHtml += '</div>';
        container.innerHTML = paginationHtml;
    }
    
    /**
     * 검색 처리
     */
    async handleSearch(query) {
        this.searchQuery = query.trim();
        this.currentPage = 1;
        await this.loadPosts();
    }
    
    /**
     * 카테고리 필터 처리
     */
    async handleCategoryFilter(category) {
        this.selectedCategory = category;
        this.currentPage = 1;
        await this.loadPosts();
    }
    
    /**
     * 태그 필터 처리
     */
    async handleTagFilter(tag) {
        // 기존 활성 태그 제거
        $$('.tag-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (this.selectedTag === tag) {
            // 같은 태그 클릭 시 필터 해제
            this.selectedTag = '';
        } else {
            // 새 태그 선택
            this.selectedTag = tag;
            const tagBtn = $(`.tag-btn[data-tag="${tag}"]`);
            if (tagBtn) tagBtn.classList.add('active');
        }
        
        this.currentPage = 1;
        await this.loadPosts();
    }
    
    /**
     * 정렬 처리
     */
    handleSort(sortBy) {
        // 클라이언트 측 정렬
        const sortedPosts = [...this.posts];
        
        switch (sortBy) {
            case 'newest':
                sortedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                sortedPosts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'popular':
                sortedPosts.sort((a, b) => b.viewCount - a.viewCount);
                break;
            case 'comments':
                sortedPosts.sort((a, b) => b.commentCount - a.commentCount);
                break;
        }
        
        this.posts = sortedPosts;
        this.renderPosts();
    }
    
    /**
     * 뷰 토글 처리
     */
    handleViewToggle(view) {
        // 버튼 상태 업데이트
        $$('.view-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // 컨테이너 클래스 업데이트
        const container = $('#posts-container');
        if (container) {
            container.className = `posts-grid ${view}-view`;
        }
        
        // 뷰 상태 저장
        Utils.storage.set('blog_view_preference', view);
        
        // 포스트 다시 렌더링
        this.renderPosts();
    }
    
    /**
     * 현재 뷰 모드 가져오기
     */
    getCurrentView() {
        const activeBtn = $('.view-toggle-btn.active');
        return activeBtn ? activeBtn.dataset.view : 'grid';
    }
    
    /**
     * 페이지 이동
     */
    async goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        await this.loadPosts();
        
        // 페이지 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    /**
     * 필터 초기화
     */
    async clearFilters() {
        this.searchQuery = '';
        this.selectedCategory = '';
        this.selectedTag = '';
        this.currentPage = 1;
        
        // UI 초기화
        const searchInput = $('#search-input');
        if (searchInput) searchInput.value = '';
        
        const categoryFilter = $('#category-filter');
        if (categoryFilter) categoryFilter.value = '';
        
        $$('.tag-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
        
        await this.loadPosts();
    }
    
    /**
     * 포스트 편집
     */
    editPost(postId) {
        window.location.href = `editor.html?id=${postId}`;
    }
    
    /**
     * 포스트 삭제
     */
    async deletePost(postId) {
        if (!confirm('정말로 이 포스트를 삭제하시겠습니까?')) return;
        
        try {
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.DELETE_POST, {
                method: 'DELETE',
                data: { id: postId }
            });
            
            if (response.success) {
                this.showSuccessMessage('포스트가 삭제되었습니다.');
                await this.loadPosts();
            } else {
                throw new Error(response.message);
            }
            
        } catch (error) {
            Utils.log.error('포스트 삭제 실패:', error);
            this.showErrorMessage('포스트 삭제에 실패했습니다.');
        }
    }
    
    /**
     * URL 업데이트
     */
    updateURL() {
        const params = new URLSearchParams();
        
        if (this.searchQuery) params.set('search', this.searchQuery);
        if (this.selectedCategory) params.set('category', this.selectedCategory);
        if (this.selectedTag) params.set('tag', this.selectedTag);
        if (this.currentPage > 1) params.set('page', this.currentPage);
        
        const newURL = `${window.location.pathname}?${params.toString()}`;
        history.replaceState(null, '', newURL);
    }
    
    /**
     * 검색 결과 요약 업데이트
     */
    updateResultsSummary(pagination) {
        const summaryElement = $('#results-summary');
        if (!summaryElement) return;
        
        let summaryText = `총 ${pagination.total}개의 포스트`;
        
        if (this.searchQuery || this.selectedCategory || this.selectedTag) {
            summaryText += ' (필터 적용됨)';
        }
        
        summaryElement.textContent = summaryText;
    }
    
    /**
     * 포스트 카드 애니메이션
     */
    animatePostCards() {
        const cards = $$('.post-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 100}ms`;
            card.classList.add('fade-in');
        });
    }
    
    /**
     * 스크롤 처리
     */
    handleScroll() {
        const scrollTop = window.pageYOffset;
        const backToTopBtn = $('#back-to-top');
        
        if (backToTopBtn) {
            backToTopBtn.style.display = scrollTop > 300 ? 'block' : 'none';
        }
    }
    
    /**
     * 로딩 상태 표시
     */
    showLoading() {
        const container = $('#posts-container');
        if (container) {
            container.classList.add('loading');
            container.innerHTML = this.createLoadingSkeleton();
        }
    }
    
    /**
     * 로딩 상태 숨김
     */
    hideLoading() {
        const container = $('#posts-container');
        if (container) {
            container.classList.remove('loading');
        }
    }
    
    /**
     * 로딩 스켈레톤 생성
     */
    createLoadingSkeleton() {
        const skeletonCards = Array.from({ length: 6 }, () => `
            <div class="post-card skeleton">
                <div class="skeleton-thumbnail"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-excerpt"></div>
                    <div class="skeleton-meta"></div>
                </div>
            </div>
        `).join('');
        
        return skeletonCards;
    }
    
    /**
     * 성공 메시지 표시
     */
    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }
    
    /**
     * 에러 메시지 표시
     */
    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }
    
    /**
     * 알림 표시
     */
    showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existingNotification = $('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 새 알림 생성
        const notification = Utils.dom.create('div', {
            className: `notification notification-${type}`,
            innerHTML: `
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            `
        });
        
        // 페이지에 추가
        document.body.appendChild(notification);
        
        // 닫기 버튼 이벤트
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // 자동 제거 (5초 후)
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // 애니메이션
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    }
    
    /**
     * 에러 표시
     */
    showError(message) {
        const container = $('#posts-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>오류가 발생했습니다</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        다시 시도
                    </button>
                </div>
            `;
        }
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.blogPage = new BlogPage();
});
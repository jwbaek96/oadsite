/**
 * 아트워크 갤러리 페이지 JavaScript
 * OA Design Studio - 오에이디자인스튜디오
 */

class ArtworkPage {
    constructor() {
        this.artwork = [];
        this.filteredArtwork = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.selectedCategory = '전체';
        this.currentView = 'grid';
        this.isLoading = false;
        this.lightboxIndex = 0;
        this.isLightboxOpen = false;
        this.masonryInstance = null;
        
        this.init();
    }
    
    /**
     * 초기화
     */
    async init() {
        try {
            this.setupEventListeners();
            this.loadFiltersFromURL();
            await this.loadArtwork();
            this.setupMasonry();
            this.setupLightbox();
            
            Utils.log.info('아트워크 페이지 초기화 완료');
        } catch (error) {
            Utils.log.error('아트워크 페이지 초기화 오류:', error);
            this.showError('아트워크를 불러오는데 실패했습니다.');
        }
    }
    
    /**
     * URL에서 필터 정보 로드
     */
    loadFiltersFromURL() {
        this.selectedCategory = Utils.url.getParam('category') || '전체';
        this.currentPage = parseInt(Utils.url.getParam('page')) || 1;
        this.currentView = Utils.url.getParam('view') || Utils.storage.get('artwork_view_preference') || 'grid';
        
        // UI 업데이트
        const categoryFilter = $('#category-filter');
        if (categoryFilter) categoryFilter.value = this.selectedCategory;
        
        // 뷰 토글 버튼 활성화
        $$('.view-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.currentView);
        });
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 카테고리 필터
        const categoryFilter = $('#category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.handleCategoryFilter(e.target.value);
            });
        }
        
        // 카테고리 버튼들 (대안)
        const categoryButtons = $$('.category-btn');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                this.handleCategoryFilter(category);
            });
        });
        
        // 뷰 토글 버튼들
        const viewToggleButtons = $$('.view-toggle-btn');
        viewToggleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.handleViewToggle(view);
            });
        });
        
        // 정렬 옵션
        const sortSelect = $('#sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.handleSort(e.target.value);
            });
        }
        
        // 라이트박스 키보드 제어
        document.addEventListener('keydown', (e) => {
            if (this.isLightboxOpen) {
                switch (e.key) {
                    case 'Escape':
                        this.closeLightbox();
                        break;
                    case 'ArrowLeft':
                        this.showPrevImage();
                        break;
                    case 'ArrowRight':
                        this.showNextImage();
                        break;
                }
            }
        });
        
        // 스크롤 이벤트
        window.addEventListener('scroll', Utils.event.throttle(() => {
            this.handleScroll();
        }, 100));
        
        // 리사이즈 이벤트 (매소너리 레이아웃 업데이트)
        window.addEventListener('resize', Utils.event.debounce(() => {
            this.updateMasonry();
        }, 300));
        
        // 관리자 기능
        if (Auth.canWrite()) {
            this.setupAdminFeatures();
        }
    }
    
    /**
     * 관리자 기능 설정
     */
    setupAdminFeatures() {
        // 새 아트워크 추가 버튼
        const addBtn = $('#add-artwork-btn');
        if (addBtn) {
            addBtn.style.display = 'block';
            addBtn.addEventListener('click', () => {
                this.showAddArtworkModal();
            });
        }
    }
    
    /**
     * 아트워크 로드
     */
    async loadArtwork() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const params = {
                page: this.currentPage,
                limit: CONFIG.ARTWORK.ITEMS_PER_PAGE,
                category: this.selectedCategory === '전체' ? '' : this.selectedCategory
            };
            
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.GET_ARTWORK, {
                method: 'GET',
                data: params
            });
            
            if (response.success) {
                this.artwork = response.data.artwork;
                this.filteredArtwork = [...this.artwork];
                this.totalPages = response.data.pagination.pages;
                
                this.renderArtwork();
                this.renderPagination(response.data.pagination);
                this.updateURL();
                this.updateResultsSummary(response.data.pagination);
                
            } else {
                throw new Error(response.message);
            }
            
        } catch (error) {
            Utils.log.error('아트워크 로드 실패:', error);
            this.showError('아트워크를 불러오는데 실패했습니다.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    /**
     * 아트워크 렌더링
     */
    renderArtwork() {
        const container = $('#artwork-container');
        if (!container) return;
        
        if (this.artwork.length === 0) {
            container.innerHTML = `
                <div class="no-artwork">
                    <h3>표시할 아트워크가 없습니다</h3>
                    <p>다른 카테고리를 선택해보세요.</p>
                    ${Auth.canWrite() ? `
                        <button class="btn btn-primary" onclick="artworkPage.showAddArtworkModal()">
                            첫 번째 아트워크 추가
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }
        
        // 컨테이너 클래스 업데이트
        container.className = `artwork-grid ${this.currentView}-view`;
        
        const artworkHtml = this.artwork.map((item, index) => 
            this.createArtworkCard(item, index)
        ).join('');
        
        container.innerHTML = artworkHtml;
        
        // 이미지 로드 완료 후 매소너리 업데이트
        this.waitForImages().then(() => {
            this.updateMasonry();
            this.animateArtworkCards();
        });
    }
    
    /**
     * 아트워크 카드 HTML 생성
     */
    createArtworkCard(item, index) {
        const formattedDate = Utils.date.format(item.createdAt, 'YYYY년 MM월');
        
        return `
            <div class="artwork-item" data-index="${index}" data-category="${item.category}">
                <div class="artwork-image" onclick="artworkPage.openLightbox(${index})">
                    <img src="${item.thumbnail || item.image}" 
                         alt="${item.title}" 
                         loading="lazy"
                         onload="artworkPage.handleImageLoad(this)">
                    <div class="artwork-overlay">
                        <div class="artwork-actions">
                            <button class="btn-icon btn-view" title="크게 보기">
                                <i class="icon-eye"></i>
                            </button>
                            <button class="btn-icon btn-fullscreen" title="전체화면">
                                <i class="icon-expand"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="artwork-info">
                    <h3 class="artwork-title">${item.title}</h3>
                    <p class="artwork-description">${item.description}</p>
                    <div class="artwork-meta">
                        <span class="artwork-category">${item.category}</span>
                        <span class="artwork-date">${formattedDate}</span>
                    </div>
                    <div class="artwork-tags">
                        ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    ${Auth.canWrite() ? this.createArtworkActions(item) : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * 아트워크 액션 버튼 생성 (관리자용)
     */
    createArtworkActions(item) {
        return `
            <div class="artwork-actions-admin">
                <button class="btn btn-sm btn-outline" onclick="artworkPage.editArtwork('${item.id}')">
                    <i class="icon-edit"></i> 수정
                </button>
                <button class="btn btn-sm btn-outline btn-danger" onclick="artworkPage.deleteArtwork('${item.id}')">
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
                <button class="page-btn" onclick="artworkPage.goToPage(${pagination.page - 1})">
                    <i class="icon-arrow-left"></i> 이전
                </button>
            `;
        }
        
        // 페이지 번호들
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);
        
        if (startPage > 1) {
            paginationHtml += `<button class="page-btn" onclick="artworkPage.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHtml += '<span class="page-ellipsis">...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button class="page-btn ${i === pagination.page ? 'active' : ''}" 
                        onclick="artworkPage.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < pagination.pages) {
            if (endPage < pagination.pages - 1) {
                paginationHtml += '<span class="page-ellipsis">...</span>';
            }
            paginationHtml += `
                <button class="page-btn" onclick="artworkPage.goToPage(${pagination.pages})">
                    ${pagination.pages}
                </button>
            `;
        }
        
        // 다음 페이지
        if (pagination.hasNext) {
            paginationHtml += `
                <button class="page-btn" onclick="artworkPage.goToPage(${pagination.page + 1})">
                    다음 <i class="icon-arrow-right"></i>
                </button>
            `;
        }
        
        paginationHtml += '</div>';
        container.innerHTML = paginationHtml;
    }
    
    /**
     * 카테고리 필터 처리
     */
    async handleCategoryFilter(category) {
        // 카테고리 버튼 활성화
        $$('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        this.selectedCategory = category;
        this.currentPage = 1;
        await this.loadArtwork();
    }
    
    /**
     * 뷰 토글 처리
     */
    handleViewToggle(view) {
        // 버튼 상태 업데이트
        $$('.view-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        this.currentView = view;
        
        // 뷰 상태 저장
        Utils.storage.set('artwork_view_preference', view);
        
        // 아트워크 다시 렌더링
        this.renderArtwork();
        this.updateURL();
    }
    
    /**
     * 정렬 처리
     */
    handleSort(sortBy) {
        const sortedArtwork = [...this.artwork];
        
        switch (sortBy) {
            case 'newest':
                sortedArtwork.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                sortedArtwork.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'title':
                sortedArtwork.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'category':
                sortedArtwork.sort((a, b) => a.category.localeCompare(b.category));
                break;
        }
        
        this.artwork = sortedArtwork;
        this.renderArtwork();
    }
    
    /**
     * 페이지 이동
     */
    async goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        await this.loadArtwork();
        
        // 페이지 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    /**
     * 매소너리 설정
     */
    setupMasonry() {
        if (this.currentView !== 'masonry') return;
        
        const container = $('#artwork-container');
        if (!container) return;
        
        // 간단한 매소너리 레이아웃 구현
        this.updateMasonry();
    }
    
    /**
     * 매소너리 업데이트
     */
    updateMasonry() {
        if (this.currentView !== 'masonry') return;
        
        const container = $('#artwork-container');
        if (!container) return;
        
        const items = container.querySelectorAll('.artwork-item');
        const columns = this.getMasonryColumns();
        const columnHeights = new Array(columns).fill(0);
        
        items.forEach(item => {
            // 가장 짧은 컬럼 찾기
            const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
            
            // 아이템 위치 설정
            const left = (shortestColumn * (100 / columns)) + '%';
            const top = columnHeights[shortestColumn] + 'px';
            
            item.style.position = 'absolute';
            item.style.left = left;
            item.style.top = top;
            item.style.width = `calc(${100 / columns}% - 10px)`;
            
            // 컬럼 높이 업데이트
            columnHeights[shortestColumn] += item.offsetHeight + 20; // 20px는 마진
        });
        
        // 컨테이너 높이 설정
        container.style.position = 'relative';
        container.style.height = Math.max(...columnHeights) + 'px';
    }
    
    /**
     * 매소너리 컬럼 수 계산
     */
    getMasonryColumns() {
        const width = window.innerWidth;
        const columns = CONFIG.ARTWORK.MASONRY_COLUMNS;
        
        if (width >= 1200) return columns.wide;
        if (width >= 768) return columns.desktop;
        if (width >= 576) return columns.tablet;
        return columns.mobile;
    }
    
    /**
     * 라이트박스 설정
     */
    setupLightbox() {
        const lightbox = $('#artwork-lightbox');
        if (!lightbox) return;
        
        // 닫기 버튼들
        const closeBtns = lightbox.querySelectorAll('.lightbox-close, .btn-close');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeLightbox();
            });
        });
        
        // 배경 클릭으로 닫기
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox();
            }
        });
        
        // 이전/다음 버튼
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.showPrevImage();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.showNextImage();
            });
        }
        
        // 슬라이드쇼 버튼
        const slideshowBtn = lightbox.querySelector('.btn-slideshow');
        if (slideshowBtn) {
            slideshowBtn.addEventListener('click', () => {
                this.toggleSlideshow();
            });
        }
    }
    
    /**
     * 라이트박스 열기
     */
    openLightbox(index) {
        const lightbox = $('#artwork-lightbox');
        if (!lightbox) return;
        
        this.lightboxIndex = index;
        this.isLightboxOpen = true;
        
        const item = this.artwork[index];
        if (!item) return;
        
        // 이미지 업데이트
        const lightboxImg = lightbox.querySelector('.lightbox-image');
        const lightboxTitle = lightbox.querySelector('.lightbox-title');
        const lightboxDescription = lightbox.querySelector('.lightbox-description');
        const lightboxMeta = lightbox.querySelector('.lightbox-meta');
        const lightboxCounter = lightbox.querySelector('.lightbox-counter');
        
        if (lightboxImg) {
            lightboxImg.src = item.image;
            lightboxImg.alt = item.title;
        }
        
        if (lightboxTitle) {
            lightboxTitle.textContent = item.title;
        }
        
        if (lightboxDescription) {
            lightboxDescription.textContent = item.description;
        }
        
        if (lightboxMeta) {
            lightboxMeta.innerHTML = `
                <span class="lightbox-category">${item.category}</span>
                <span class="lightbox-date">${Utils.date.format(item.createdAt, 'YYYY년 MM월')}</span>
            `;
        }
        
        if (lightboxCounter) {
            lightboxCounter.textContent = `${index + 1} / ${this.artwork.length}`;
        }
        
        // 태그 표시
        const lightboxTags = lightbox.querySelector('.lightbox-tags');
        if (lightboxTags) {
            lightboxTags.innerHTML = item.tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('');
        }
        
        // 라이트박스 표시
        lightbox.style.display = 'flex';
        document.body.classList.add('lightbox-open');
        
        // 이미지 로드 완료 시 애니메이션
        lightboxImg.onload = () => {
            lightboxImg.classList.add('loaded');
        };
    }
    
    /**
     * 라이트박스 닫기
     */
    closeLightbox() {
        const lightbox = $('#artwork-lightbox');
        if (lightbox) {
            lightbox.style.display = 'none';
            document.body.classList.remove('lightbox-open');
            this.isLightboxOpen = false;
            
            // 슬라이드쇼 중지
            this.stopSlideshow();
        }
    }
    
    /**
     * 이전 이미지 보기
     */
    showPrevImage() {
        this.lightboxIndex = (this.lightboxIndex - 1 + this.artwork.length) % this.artwork.length;
        this.openLightbox(this.lightboxIndex);
    }
    
    /**
     * 다음 이미지 보기
     */
    showNextImage() {
        this.lightboxIndex = (this.lightboxIndex + 1) % this.artwork.length;
        this.openLightbox(this.lightboxIndex);
    }
    
    /**
     * 슬라이드쇼 토글
     */
    toggleSlideshow() {
        if (this.slideshowTimer) {
            this.stopSlideshow();
        } else {
            this.startSlideshow();
        }
    }
    
    /**
     * 슬라이드쇼 시작
     */
    startSlideshow() {
        const slideshowBtn = $('.btn-slideshow');
        if (slideshowBtn) {
            slideshowBtn.innerHTML = '<i class="icon-pause"></i> 일시정지';
        }
        
        this.slideshowTimer = setInterval(() => {
            this.showNextImage();
        }, 3000);
    }
    
    /**
     * 슬라이드쇼 중지
     */
    stopSlideshow() {
        if (this.slideshowTimer) {
            clearInterval(this.slideshowTimer);
            this.slideshowTimer = null;
            
            const slideshowBtn = $('.btn-slideshow');
            if (slideshowBtn) {
                slideshowBtn.innerHTML = '<i class="icon-play"></i> 슬라이드쇼';
            }
        }
    }
    
    /**
     * 이미지 로드 처리
     */
    handleImageLoad(img) {
        img.classList.add('loaded');
        
        // 매소너리 레이아웃 업데이트
        if (this.currentView === 'masonry') {
            this.updateMasonry();
        }
    }
    
    /**
     * 모든 이미지 로드 대기
     */
    waitForImages() {
        const images = $$('#artwork-container img');
        const promises = Array.from(images).map(img => {
            return new Promise(resolve => {
                if (img.complete) {
                    resolve();
                } else {
                    img.onload = resolve;
                    img.onerror = resolve;
                }
            });
        });
        
        return Promise.all(promises);
    }
    
    /**
     * 아트워크 편집 (관리자용)
     */
    editArtwork(artworkId) {
        // 편집 모달 표시 (간단한 구현)
        this.showArtworkModal(artworkId);
    }
    
    /**
     * 아트워크 삭제 (관리자용)
     */
    async deleteArtwork(artworkId) {
        if (!confirm('정말로 이 아트워크를 삭제하시겠습니까?')) return;
        
        try {
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.DELETE_ARTWORK, {
                method: 'DELETE',
                data: { id: artworkId }
            });
            
            if (response.success) {
                this.showSuccessMessage('아트워크가 삭제되었습니다.');
                await this.loadArtwork();
            } else {
                throw new Error(response.message);
            }
            
        } catch (error) {
            Utils.log.error('아트워크 삭제 실패:', error);
            this.showErrorMessage('아트워크 삭제에 실패했습니다.');
        }
    }
    
    /**
     * 아트워크 추가 모달 표시
     */
    showAddArtworkModal() {
        this.showArtworkModal();
    }
    
    /**
     * 아트워크 모달 표시
     */
    showArtworkModal(artworkId = null) {
        const modal = $('#artwork-modal');
        if (!modal) {
            // 모달이 없으면 간단한 입력 받기
            this.showSimpleArtworkForm(artworkId);
            return;
        }
        
        // 모달 표시 로직
        modal.style.display = 'block';
        
        // 편집 모드인 경우 데이터 로드
        if (artworkId) {
            this.loadArtworkForEdit(artworkId);
        }
    }
    
    /**
     * 간단한 아트워크 폼 표시
     */
    showSimpleArtworkForm(artworkId) {
        const title = prompt('아트워크 제목을 입력하세요:');
        if (!title) return;
        
        const description = prompt('설명을 입력하세요:');
        const category = prompt('카테고리를 입력하세요:');
        const tags = prompt('태그를 쉼표로 구분하여 입력하세요:');
        
        const artworkData = {
            title,
            description: description || '',
            category: category || '기타',
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        };
        
        if (artworkId) {
            this.updateArtwork(artworkId, artworkData);
        } else {
            this.createArtwork(artworkData);
        }
    }
    
    /**
     * 아트워크 생성
     */
    async createArtwork(artworkData) {
        try {
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.CREATE_ARTWORK, {
                method: 'POST',
                data: artworkData
            });
            
            if (response.success) {
                this.showSuccessMessage('아트워크가 추가되었습니다.');
                await this.loadArtwork();
            } else {
                throw new Error(response.message);
            }
            
        } catch (error) {
            Utils.log.error('아트워크 생성 실패:', error);
            this.showErrorMessage('아트워크 추가에 실패했습니다.');
        }
    }
    
    /**
     * 아트워크 업데이트
     */
    async updateArtwork(artworkId, artworkData) {
        try {
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.UPDATE_ARTWORK, {
                method: 'PUT',
                data: { ...artworkData, id: artworkId }
            });
            
            if (response.success) {
                this.showSuccessMessage('아트워크가 수정되었습니다.');
                await this.loadArtwork();
            } else {
                throw new Error(response.message);
            }
            
        } catch (error) {
            Utils.log.error('아트워크 수정 실패:', error);
            this.showErrorMessage('아트워크 수정에 실패했습니다.');
        }
    }
    
    /**
     * URL 업데이트
     */
    updateURL() {
        const params = new URLSearchParams();
        
        if (this.selectedCategory !== '전체') params.set('category', this.selectedCategory);
        if (this.currentPage > 1) params.set('page', this.currentPage);
        if (this.currentView !== 'grid') params.set('view', this.currentView);
        
        const newURL = `${window.location.pathname}?${params.toString()}`;
        history.replaceState(null, '', newURL);
    }
    
    /**
     * 결과 요약 업데이트
     */
    updateResultsSummary(pagination) {
        const summaryElement = $('#results-summary');
        if (!summaryElement) return;
        
        let summaryText = `총 ${pagination.total}개의 아트워크`;
        
        if (this.selectedCategory !== '전체') {
            summaryText += ` (${this.selectedCategory})`;
        }
        
        summaryElement.textContent = summaryText;
    }
    
    /**
     * 아트워크 카드 애니메이션
     */
    animateArtworkCards() {
        const cards = $$('.artwork-item');
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
        const container = $('#artwork-container');
        if (container) {
            container.classList.add('loading');
            container.innerHTML = this.createLoadingSkeleton();
        }
    }
    
    /**
     * 로딩 상태 숨김
     */
    hideLoading() {
        const container = $('#artwork-container');
        if (container) {
            container.classList.remove('loading');
        }
    }
    
    /**
     * 로딩 스켈레톤 생성
     */
    createLoadingSkeleton() {
        const skeletonCards = Array.from({ length: 8 }, () => `
            <div class="artwork-item skeleton">
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-description"></div>
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
        const container = $('#artwork-container');
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
    
    /**
     * 소멸자
     */
    destroy() {
        if (this.slideshowTimer) {
            clearInterval(this.slideshowTimer);
        }
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.artworkPage = new ArtworkPage();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (window.artworkPage) {
        window.artworkPage.destroy();
    }
});
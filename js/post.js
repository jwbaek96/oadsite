/**
 * 개별 포스트 페이지 JavaScript
 * OA Design Studio - 오에이디자인스튜디오
 */

class PostPage {
    constructor() {
        this.post = null;
        this.comments = [];
        this.postId = null;
        this.currentImageIndex = 0;
        this.images = [];
        
        this.init();
    }
    
    /**
     * 초기화
     */
    async init() {
        try {
            this.postId = Utils.url.getParam('id');
            
            if (!this.postId) {
                throw new Error('포스트 ID가 없습니다.');
            }
            
            this.setupEventListeners();
            await this.loadPost();
            await this.loadComments();
            this.setupImageLightbox();
            this.incrementViewCount();
            
            Utils.log.info('포스트 페이지 초기화 완료');
        } catch (error) {
            Utils.log.error('포스트 페이지 초기화 오류:', error);
            this.showError(error.message);
        }
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 댓글 폼
        const commentForm = $('#comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => {
                this.handleCommentSubmit(e);
            });
        }
        
        // 공유 버튼들
        const shareButtons = $$('.share-btn');
        shareButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                this.sharePost(platform);
            });
        });
        
        // 북마크 버튼
        const bookmarkBtn = $('#bookmark-btn');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => {
                this.toggleBookmark();
            });
        }
        
        // 인쇄 버튼
        const printBtn = $('#print-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
        
        // 관리자 버튼들
        const editBtn = $('#edit-post-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                window.location.href = `editor.html?id=${this.postId}`;
            });
        }
        
        const deleteBtn = $('#delete-post-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deletePost();
            });
        }
        
        // 목차 네비게이션
        this.setupTableOfContents();
        
        // 스크롤 이벤트
        window.addEventListener('scroll', Utils.event.throttle(() => {
            this.updateReadingProgress();
            this.updateActiveHeading();
        }, 100));
        
        // 키보드 이벤트 (라이트박스 ESC)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeLightbox();
            }
        });
    }
    
    /**
     * 포스트 로드
     */
    async loadPost() {
        try {
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.GET_POST, {
                method: 'GET',
                data: { id: this.postId }
            });
            
            if (response.success) {
                this.post = response.data;
                this.renderPost();
                this.updateMetaTags();
            } else {
                throw new Error(response.message || '포스트를 찾을 수 없습니다.');
            }
            
        } catch (error) {
            Utils.log.error('포스트 로드 실패:', error);
            throw error;
        }
    }
    
    /**
     * 포스트 렌더링
     */
    renderPost() {
        if (!this.post) return;
        
        // 제목
        const titleElement = $('#post-title');
        if (titleElement) titleElement.textContent = this.post.title;
        
        // 메타 정보
        const metaElement = $('#post-meta');
        if (metaElement) {
            const formattedDate = Utils.date.format(this.post.createdAt, 'YYYY년 MM월 DD일');
            const timeAgo = Utils.date.timeAgo(this.post.createdAt);
            
            metaElement.innerHTML = `
                <div class="post-author">
                    <img src="/assets/images/default-avatar.jpg" alt="${this.post.author}" class="author-avatar">
                    <div class="author-info">
                        <span class="author-name">${this.post.author}</span>
                        <span class="post-date" title="${formattedDate}">${timeAgo}</span>
                    </div>
                </div>
                <div class="post-stats">
                    <span class="post-category">${this.post.category}</span>
                    <span class="view-count">
                        <i class="icon-eye"></i> ${this.post.viewCount}
                    </span>
                    <span class="comment-count">
                        <i class="icon-comment"></i> ${this.post.commentCount}
                    </span>
                </div>
            `;
        }
        
        // 썸네일
        const thumbnailElement = $('#post-thumbnail');
        if (thumbnailElement && this.post.thumbnail) {
            thumbnailElement.innerHTML = `
                <img src="${this.post.thumbnail}" alt="${this.post.title}" class="post-thumbnail-img">
            `;
        }
        
        // 내용
        const contentElement = $('#post-content');
        if (contentElement) {
            contentElement.innerHTML = this.post.content;
            
            // 코드 하이라이팅
            this.highlightCode();
            
            // 이미지 처리
            this.processImages();
        }
        
        // 태그
        const tagsElement = $('#post-tags');
        if (tagsElement && this.post.tags) {
            tagsElement.innerHTML = this.post.tags.map(tag => `
                <a href="blog.html?tag=${encodeURIComponent(tag)}" class="tag">${tag}</a>
            `).join('');
        }
        
        // 관리자 버튼 표시
        this.showAdminButtons();
        
        // 북마크 상태 확인
        this.checkBookmarkStatus();
    }
    
    /**
     * 메타 태그 업데이트 (SEO)
     */
    updateMetaTags() {
        if (!this.post) return;
        
        // 제목
        document.title = `${this.post.title} - ${CONFIG.SITE_NAME}`;
        
        // 메타 태그들
        const metaTags = [
            { name: 'description', content: this.post.excerpt },
            { property: 'og:title', content: this.post.title },
            { property: 'og:description', content: this.post.excerpt },
            { property: 'og:image', content: this.post.thumbnail || '/assets/images/default-post.jpg' },
            { property: 'og:url', content: window.location.href },
            { property: 'og:type', content: 'article' },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: this.post.title },
            { name: 'twitter:description', content: this.post.excerpt },
            { name: 'twitter:image', content: this.post.thumbnail || '/assets/images/default-post.jpg' }
        ];
        
        metaTags.forEach(tag => {
            let element = document.querySelector(`meta[${Object.keys(tag)[0]}="${Object.values(tag)[0]}"]`);
            if (element) {
                element.setAttribute('content', Object.values(tag)[1]);
            } else {
                element = document.createElement('meta');
                element.setAttribute(Object.keys(tag)[0], Object.values(tag)[0]);
                element.setAttribute('content', Object.values(tag)[1]);
                document.head.appendChild(element);
            }
        });
        
        // JSON-LD 구조화 데이터
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": this.post.title,
            "description": this.post.excerpt,
            "image": this.post.thumbnail || '/assets/images/default-post.jpg',
            "author": {
                "@type": "Person",
                "name": this.post.author
            },
            "publisher": {
                "@type": "Organization",
                "name": CONFIG.SITE_NAME,
                "logo": {
                    "@type": "ImageObject",
                    "url": "/assets/images/logo.png"
                }
            },
            "datePublished": this.post.createdAt,
            "dateModified": this.post.updatedAt,
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": window.location.href
            }
        };
        
        const scriptTag = document.createElement('script');
        scriptTag.type = 'application/ld+json';
        scriptTag.textContent = JSON.stringify(structuredData);
        document.head.appendChild(scriptTag);
    }
    
    /**
     * 댓글 로드
     */
    async loadComments() {
        try {
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.GET_COMMENTS, {
                method: 'GET',
                data: { postId: this.postId }
            });
            
            if (response.success) {
                this.comments = response.data;
                this.renderComments();
            } else {
                Utils.log.warn('댓글 로드 실패:', response.message);
            }
            
        } catch (error) {
            Utils.log.error('댓글 로드 오류:', error);
        }
    }
    
    /**
     * 댓글 렌더링
     */
    renderComments() {
        const container = $('#comments-list');
        if (!container) return;
        
        if (this.comments.length === 0) {
            container.innerHTML = '<p class="no-comments">아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>';
            return;
        }
        
        const commentsHtml = this.comments.map(comment => this.createCommentHTML(comment)).join('');
        container.innerHTML = commentsHtml;
        
        // 댓글 수 업데이트
        const countElement = $('#comments-count');
        if (countElement) {
            countElement.textContent = this.comments.length;
        }
    }
    
    /**
     * 댓글 HTML 생성
     */
    createCommentHTML(comment) {
        const formattedDate = Utils.date.format(comment.createdAt, 'YYYY년 MM월 DD일 HH:mm');
        const timeAgo = Utils.date.timeAgo(comment.createdAt);
        
        return `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-avatar">
                    <img src="/assets/images/default-avatar.jpg" alt="${comment.author}">
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-date" title="${formattedDate}">${timeAgo}</span>
                        ${Auth.canDelete() ? `
                            <button class="comment-delete-btn" onclick="postPage.deleteComment('${comment.id}')">
                                <i class="icon-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                    <div class="comment-body">
                        ${comment.content.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 댓글 제출 처리
     */
    async handleCommentSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // 로딩 상태
        submitBtn.textContent = '댓글 등록 중...';
        submitBtn.disabled = true;
        
        try {
            const commentData = {
                postId: this.postId,
                author: formData.get('author'),
                email: formData.get('email'),
                content: formData.get('content')
            };
            
            // 유효성 검사
            if (!commentData.author || !commentData.email || !commentData.content) {
                throw new Error('모든 필드를 입력해주세요.');
            }
            
            if (!this.validateEmail(commentData.email)) {
                throw new Error('올바른 이메일 주소를 입력해주세요.');
            }
            
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.CREATE_COMMENT, {
                method: 'POST',
                data: commentData
            });
            
            if (response.success) {
                this.showSuccessMessage('댓글이 등록되었습니다. 승인 후 표시됩니다.');
                form.reset();
                
                // 댓글 목록 새로고침
                await this.loadComments();
            } else {
                throw new Error(response.message || '댓글 등록에 실패했습니다.');
            }
            
        } catch (error) {
            Utils.log.error('댓글 등록 오류:', error);
            this.showErrorMessage(error.message);
        } finally {
            // 버튼 상태 복원
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    /**
     * 댓글 삭제
     */
    async deleteComment(commentId) {
        if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;
        
        try {
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.DELETE_COMMENT, {
                method: 'DELETE',
                data: { id: commentId }
            });
            
            if (response.success) {
                this.showSuccessMessage('댓글이 삭제되었습니다.');
                await this.loadComments();
            } else {
                throw new Error(response.message || '댓글 삭제에 실패했습니다.');
            }
            
        } catch (error) {
            Utils.log.error('댓글 삭제 오류:', error);
            this.showErrorMessage(error.message);
        }
    }
    
    /**
     * 포스트 공유
     */
    sharePost(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(this.post.title);
        const text = encodeURIComponent(this.post.excerpt);
        
        let shareUrl;
        
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=${title}&body=${text}%0A%0A${url}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(window.location.href).then(() => {
                    this.showSuccessMessage('링크가 클립보드에 복사되었습니다.');
                });
                return;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }
    
    /**
     * 북마크 토글
     */
    toggleBookmark() {
        const bookmarks = JSON.parse(Utils.storage.get('bookmarked_posts') || '[]');
        const isBookmarked = bookmarks.includes(this.postId);
        
        if (isBookmarked) {
            // 북마크 제거
            const index = bookmarks.indexOf(this.postId);
            bookmarks.splice(index, 1);
            this.showSuccessMessage('북마크에서 제거되었습니다.');
        } else {
            // 북마크 추가
            bookmarks.push(this.postId);
            this.showSuccessMessage('북마크에 추가되었습니다.');
        }
        
        Utils.storage.set('bookmarked_posts', JSON.stringify(bookmarks));
        this.updateBookmarkButton(!isBookmarked);
    }
    
    /**
     * 북마크 상태 확인
     */
    checkBookmarkStatus() {
        const bookmarks = JSON.parse(Utils.storage.get('bookmarked_posts') || '[]');
        const isBookmarked = bookmarks.includes(this.postId);
        this.updateBookmarkButton(isBookmarked);
    }
    
    /**
     * 북마크 버튼 업데이트
     */
    updateBookmarkButton(isBookmarked) {
        const bookmarkBtn = $('#bookmark-btn');
        if (bookmarkBtn) {
            bookmarkBtn.classList.toggle('bookmarked', isBookmarked);
            bookmarkBtn.innerHTML = isBookmarked 
                ? '<i class="icon-bookmark-filled"></i> 북마크됨'
                : '<i class="icon-bookmark"></i> 북마크';
        }
    }
    
    /**
     * 포스트 삭제
     */
    async deletePost() {
        if (!confirm('정말로 이 포스트를 삭제하시겠습니까?')) return;
        
        try {
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.DELETE_POST, {
                method: 'DELETE',
                data: { id: this.postId }
            });
            
            if (response.success) {
                this.showSuccessMessage('포스트가 삭제되었습니다.');
                setTimeout(() => {
                    window.location.href = 'blog.html';
                }, 2000);
            } else {
                throw new Error(response.message || '포스트 삭제에 실패했습니다.');
            }
            
        } catch (error) {
            Utils.log.error('포스트 삭제 오류:', error);
            this.showErrorMessage(error.message);
        }
    }
    
    /**
     * 관리자 버튼 표시
     */
    showAdminButtons() {
        if (Auth.canWrite()) {
            const adminActions = $('#admin-actions');
            if (adminActions) {
                adminActions.style.display = 'block';
            }
        }
    }
    
    /**
     * 조회수 증가
     */
    async incrementViewCount() {
        try {
            // 중복 조회 방지 (세션 스토리지 사용)
            const viewedPosts = JSON.parse(sessionStorage.getItem('viewed_posts') || '[]');
            
            if (!viewedPosts.includes(this.postId)) {
                await SheetsAPI.request('/api/post/view', {
                    method: 'POST',
                    data: { id: this.postId }
                });
                
                viewedPosts.push(this.postId);
                sessionStorage.setItem('viewed_posts', JSON.stringify(viewedPosts));
            }
            
        } catch (error) {
            Utils.log.warn('조회수 업데이트 실패:', error);
        }
    }
    
    /**
     * 목차 설정
     */
    setupTableOfContents() {
        const tocContainer = $('#table-of-contents');
        if (!tocContainer) return;
        
        const headings = $$('#post-content h1, #post-content h2, #post-content h3');
        
        if (headings.length === 0) {
            tocContainer.style.display = 'none';
            return;
        }
        
        const tocList = headings.map((heading, index) => {
            const id = `heading-${index}`;
            heading.id = id;
            
            const level = parseInt(heading.tagName.substring(1));
            const indent = (level - 1) * 20;
            
            return `
                <li class="toc-item toc-level-${level}" style="margin-left: ${indent}px">
                    <a href="#${id}" class="toc-link">${heading.textContent}</a>
                </li>
            `;
        }).join('');
        
        tocContainer.innerHTML = `
            <h4>목차</h4>
            <ul class="toc-list">${tocList}</ul>
        `;
        
        // 목차 링크 클릭 이벤트
        $$('.toc-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = $(`#${targetId}`);
                if (target) {
                    Utils.dom.smoothScrollTo(target, 80);
                }
            });
        });
    }
    
    /**
     * 읽기 진행도 업데이트
     */
    updateReadingProgress() {
        const progressBar = $('#reading-progress');
        if (!progressBar) return;
        
        const postContent = $('#post-content');
        if (!postContent) return;
        
        const contentTop = postContent.offsetTop;
        const contentHeight = postContent.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollTop = window.pageYOffset;
        
        const progress = Math.min(
            Math.max((scrollTop - contentTop + windowHeight) / contentHeight, 0), 
            1
        ) * 100;
        
        progressBar.style.width = `${progress}%`;
    }
    
    /**
     * 활성 제목 업데이트
     */
    updateActiveHeading() {
        const headings = $$('#post-content h1, #post-content h2, #post-content h3');
        const tocLinks = $$('.toc-link');
        
        let activeIndex = -1;
        
        headings.forEach((heading, index) => {
            const rect = heading.getBoundingClientRect();
            if (rect.top <= 100) {
                activeIndex = index;
            }
        });
        
        tocLinks.forEach((link, index) => {
            link.classList.toggle('active', index === activeIndex);
        });
    }
    
    /**
     * 코드 하이라이팅
     */
    highlightCode() {
        const codeBlocks = $$('#post-content pre code');
        codeBlocks.forEach(block => {
            // 여기서 실제 코드 하이라이팅 라이브러리를 사용할 수 있습니다
            // 예: Prism.js, highlight.js 등
            block.classList.add('highlighted');
        });
    }
    
    /**
     * 이미지 처리 및 라이트박스 설정
     */
    processImages() {
        const images = $$('#post-content img');
        this.images = Array.from(images);
        
        images.forEach((img, index) => {
            img.addEventListener('click', () => {
                this.openLightbox(index);
            });
            
            img.style.cursor = 'pointer';
            img.setAttribute('data-index', index);
        });
    }
    
    /**
     * 이미지 라이트박스 설정
     */
    setupImageLightbox() {
        const lightbox = $('#image-lightbox');
        if (!lightbox) return;
        
        // 닫기 이벤트
        const closeBtn = lightbox.querySelector('.lightbox-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeLightbox();
            });
        }
        
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
    }
    
    /**
     * 라이트박스 열기
     */
    openLightbox(index) {
        const lightbox = $('#image-lightbox');
        if (!lightbox) return;
        
        this.currentImageIndex = index;
        const img = this.images[index];
        
        const lightboxImg = lightbox.querySelector('.lightbox-image');
        const lightboxCaption = lightbox.querySelector('.lightbox-caption');
        
        if (lightboxImg) {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
        }
        
        if (lightboxCaption) {
            lightboxCaption.textContent = img.alt || '';
        }
        
        // 이미지 카운터 업데이트
        const counter = lightbox.querySelector('.lightbox-counter');
        if (counter) {
            counter.textContent = `${index + 1} / ${this.images.length}`;
        }
        
        lightbox.style.display = 'flex';
        document.body.classList.add('lightbox-open');
    }
    
    /**
     * 라이트박스 닫기
     */
    closeLightbox() {
        const lightbox = $('#image-lightbox');
        if (lightbox) {
            lightbox.style.display = 'none';
            document.body.classList.remove('lightbox-open');
        }
    }
    
    /**
     * 이전 이미지 보기
     */
    showPrevImage() {
        this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
        this.openLightbox(this.currentImageIndex);
    }
    
    /**
     * 다음 이미지 보기
     */
    showNextImage() {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
        this.openLightbox(this.currentImageIndex);
    }
    
    /**
     * 이메일 유효성 검사
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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
        const container = $('#post-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h2>오류가 발생했습니다</h2>
                    <p>${message}</p>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="history.back()">
                            이전 페이지로
                        </button>
                        <button class="btn btn-secondary" onclick="location.href='blog.html'">
                            블로그 목록으로
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.postPage = new PostPage();
});
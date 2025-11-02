// Instagram Style JavaScript
class InstagramApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.loadMorePosts();
    }

    setupEventListeners() {
        // Like button functionality
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', this.handleLike.bind(this));
        });

        // Follow button functionality
        document.querySelectorAll('.follow-btn').forEach(btn => {
            btn.addEventListener('click', this.handleFollow.bind(this));
        });

        // Navigation clicks
        document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(link => {
            link.addEventListener('click', this.handleNavigation.bind(this));
        });

        // Story clicks
        document.querySelectorAll('.story-item').forEach(story => {
            story.addEventListener('click', this.handleStoryClick.bind(this));
        });

        // Post options
        document.querySelectorAll('.post-options').forEach(btn => {
            btn.addEventListener('click', this.handlePostOptions.bind(this));
        });

        // Comment button
        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', this.handleComment.bind(this));
        });

        // Share button
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', this.handleShare.bind(this));
        });

        // Bookmark button
        document.querySelectorAll('.bookmark-btn').forEach(btn => {
            btn.addEventListener('click', this.handleBookmark.bind(this));
        });

        // View comments
        document.querySelectorAll('.view-comments').forEach(btn => {
            btn.addEventListener('click', this.handleViewComments.bind(this));
        });

        // Mobile navigation
        this.setupMobileNavigation();

        // Mobile menu toggle
        this.setupMobileMenu();

        // Services accordion
        this.setupServicesAccordion();

        // Keyboard navigation
        this.setupKeyboardNavigation();
    }

    handleLike(e) {
        e.preventDefault();
        const btn = e.currentTarget;
        const svg = btn.querySelector('svg');
        const post = btn.closest('.post');
        const likesCountElement = post.querySelector('.likes-count');
        
        // Toggle like state
        const isLiked = btn.classList.contains('liked');
        
        if (isLiked) {
            btn.classList.remove('liked');
            svg.innerHTML = `
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            `;
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            
            // Decrease like count
            const currentLikes = parseInt(likesCountElement.textContent.match(/\d+/)[0]);
            likesCountElement.textContent = `좋아요 ${currentLikes - 1}개`;
        } else {
            btn.classList.add('liked');
            svg.innerHTML = `
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            `;
            svg.setAttribute('fill', '#ed4956');
            svg.setAttribute('stroke', '#ed4956');
            
            // Increase like count
            const currentLikes = parseInt(likesCountElement.textContent.match(/\d+/)[0]);
            likesCountElement.textContent = `좋아요 ${currentLikes + 1}개`;
            
            // Like animation
            this.animateLike(btn);
        }
    }

    animateLike(btn) {
        btn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 150);
    }

    handleFollow(e) {
        e.preventDefault();
        const btn = e.currentTarget;
        const isFollowing = btn.classList.contains('following');
        
        if (isFollowing) {
            btn.classList.remove('following');
            btn.textContent = '팔로우';
            btn.style.color = '#0095f6';
        } else {
            btn.classList.add('following');
            btn.textContent = '팔로잉';
            btn.style.color = '#8e8e8e';
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        const link = e.currentTarget;
        const isActive = link.closest('.nav-item')?.classList.contains('active') || 
                        link.classList.contains('active');
        
        if (!isActive) {
            // Remove active class from all nav items
            document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked item
            if (link.closest('.nav-item')) {
                link.closest('.nav-item').classList.add('active');
            } else {
                link.classList.add('active');
            }
            
            // Show loading state
            this.showLoadingState();
            
            // Simulate navigation delay
            setTimeout(() => {
                this.hideLoadingState();
            }, 800);
        }
    }

    handleStoryClick(e) {
        const story = e.currentTarget;
        const username = story.querySelector('.story-username').textContent;
        
        // Add viewed state
        story.classList.add('viewed');
        
        // Show story modal (simulate)
        this.showStoryModal(username);
    }

    showStoryModal(username) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'story-modal-overlay';
        modal.innerHTML = `
            <div class="story-modal">
                <div class="story-header">
                    <div class="story-user">
                        <div class="story-avatar-small">
                            <img src="https://via.placeholder.com/32/6366f1/ffffff?text=${username.charAt(0).toUpperCase()}" alt="${username}">
                        </div>
                        <span class="story-username">${username}</span>
                        <span class="story-time">3시간 전</span>
                    </div>
                    <button class="story-close">×</button>
                </div>
                <div class="story-content">
                    <img src="https://via.placeholder.com/375x667/6366f1/ffffff?text=${username}+Story" alt="${username} 스토리">
                </div>
                <div class="story-progress">
                    <div class="story-progress-bar"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal functionality
        modal.querySelector('.story-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Auto close after 5 seconds
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 5000);
    }

    handlePostOptions(e) {
        e.preventDefault();
        const btn = e.currentTarget;
        
        // Create options menu
        const menu = document.createElement('div');
        menu.className = 'post-options-menu';
        menu.innerHTML = `
            <div class="options-menu">
                <button class="option-item">신고</button>
                <button class="option-item">팔로우 취소</button>
                <button class="option-item">게시물로 이동</button>
                <button class="option-item">공유 대상...</button>
                <button class="option-item">링크 복사</button>
                <button class="option-item">퍼가기</button>
                <button class="option-item cancel">취소</button>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Position menu
        const rect = btn.getBoundingClientRect();
        const menuRect = menu.querySelector('.options-menu');
        menu.style.position = 'fixed';
        menu.style.top = '0';
        menu.style.left = '0';
        menu.style.width = '100%';
        menu.style.height = '100%';
        menu.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        menu.style.display = 'flex';
        menu.style.alignItems = 'center';
        menu.style.justifyContent = 'center';
        menu.style.zIndex = '10000';
        
        // Close menu functionality
        menu.addEventListener('click', (e) => {
            if (e.target === menu || e.target.classList.contains('cancel')) {
                document.body.removeChild(menu);
            }
        });
    }

    handleComment(e) {
        e.preventDefault();
        const post = e.currentTarget.closest('.post');
        const commentsSection = post.querySelector('.post-comments');
        
        // Show comment input (simulate)
        if (!post.querySelector('.comment-input')) {
            const commentInput = document.createElement('div');
            commentInput.className = 'comment-input';
            commentInput.innerHTML = `
                <input type="text" placeholder="댓글 달기..." class="comment-text">
                <button class="comment-submit">게시</button>
            `;
            
            post.querySelector('.post-content').appendChild(commentInput);
            
            // Focus input
            commentInput.querySelector('.comment-text').focus();
            
            // Handle submit
            commentInput.querySelector('.comment-submit').addEventListener('click', () => {
                const text = commentInput.querySelector('.comment-text').value;
                if (text.trim()) {
                    this.addComment(post, text);
                    commentInput.remove();
                }
            });
            
            // Handle enter key
            commentInput.querySelector('.comment-text').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const text = e.target.value;
                    if (text.trim()) {
                        this.addComment(post, text);
                        commentInput.remove();
                    }
                }
            });
        }
    }

    addComment(post, text) {
        const commentsSection = post.querySelector('.post-comments');
        const newComment = document.createElement('div');
        newComment.className = 'comment';
        newComment.innerHTML = `
            <span class="comment-username">oadesignstudio</span>
            <span class="comment-text">${text}</span>
            <button class="comment-like">♡</button>
        `;
        
        commentsSection.appendChild(newComment);
        
        // Update comments count
        const viewCommentsBtn = post.querySelector('.view-comments');
        if (viewCommentsBtn) {
            const currentCount = parseInt(viewCommentsBtn.textContent.match(/\d+/)[0]);
            viewCommentsBtn.textContent = `댓글 ${currentCount + 1}개 모두 보기`;
        }
    }

    handleShare(e) {
        e.preventDefault();
        
        // Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: 'OA Design Studio',
                text: '창의적인 디자인으로 브랜드 스토리를 만들어갑니다.',
                url: window.location.href
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showToast('링크가 복사되었습니다');
            });
        }
    }

    handleBookmark(e) {
        e.preventDefault();
        const btn = e.currentTarget;
        const svg = btn.querySelector('svg');
        const isBookmarked = btn.classList.contains('bookmarked');
        
        if (isBookmarked) {
            btn.classList.remove('bookmarked');
            svg.setAttribute('fill', 'none');
            this.showToast('저장됨에서 제거되었습니다');
        } else {
            btn.classList.add('bookmarked');
            svg.setAttribute('fill', 'currentColor');
            this.showToast('저장됨에 추가되었습니다');
        }
    }

    handleViewComments(e) {
        e.preventDefault();
        const btn = e.currentTarget;
        const post = btn.closest('.post');
        
        // Simulate loading comments
        btn.textContent = '댓글 로딩 중...';
        
        setTimeout(() => {
            btn.textContent = '댓글 숨기기';
            
            // Add sample comments
            const commentsContainer = document.createElement('div');
            commentsContainer.className = 'comments-container';
            commentsContainer.innerHTML = `
                <div class="comment">
                    <span class="comment-username">designlover_kr</span>
                    <span class="comment-text">정말 멋진 작품이네요! 👏</span>
                    <button class="comment-like">♡</button>
                </div>
                <div class="comment">
                    <span class="comment-username">webdev_pro</span>
                    <span class="comment-text">어떤 기술 스택을 사용하셨나요?</span>
                    <button class="comment-like">♡</button>
                </div>
                <div class="comment">
                    <span class="comment-username">ui_designer_seoul</span>
                    <span class="comment-text">색상 조합이 정말 예술이에요 🎨</span>
                    <button class="comment-like">♡</button>
                </div>
            `;
            
            btn.parentNode.appendChild(commentsContainer);
            
            // Update button functionality
            btn.onclick = () => {
                commentsContainer.remove();
                const originalCount = post.querySelector('.post-comments').dataset.originalCount || '15';
                btn.textContent = `댓글 ${originalCount}개 모두 보기`;
            };
        }, 500);
    }

    setupMobileNavigation() {
        // Handle mobile navigation
        if (window.innerWidth <= 768) {
            document.body.classList.add('mobile-view');
        }
        
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                document.body.classList.add('mobile-view');
            } else {
                document.body.classList.remove('mobile-view');
            }
        });
    }

    setupMobileMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const menuClose = document.querySelector('.mobile-menu-close');
        const menuOverlay = document.querySelector('.mobile-menu-overlay');
        const menuLinks = document.querySelectorAll('.mobile-menu-link');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                menuToggle.classList.toggle('active');
                menuOverlay.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });
        }

        if (menuClose) {
            menuClose.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        }

        // Close menu when clicking on overlay
        if (menuOverlay) {
            menuOverlay.addEventListener('click', (e) => {
                if (e.target === menuOverlay) {
                    menuToggle.classList.remove('active');
                    menuOverlay.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            });
        }

        // Close menu when clicking on menu links
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });

        // Prevent body scroll when menu is open
        menuOverlay.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    setupServicesAccordion() {
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        
        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const accordionItem = header.closest('.accordion-item');
                const isCurrentlyActive = accordionItem.classList.contains('active');
                
                // Close all accordion items
                document.querySelectorAll('.accordion-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // If the clicked item wasn't active, open it
                if (!isCurrentlyActive) {
                    accordionItem.classList.add('active');
                    
                    // Smooth scroll to show the opened accordion
                    setTimeout(() => {
                        accordionItem.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest'
                        });
                    }, 300);
                }
            });
        });

        // Setup horizontal scroll for service items
        this.setupHorizontalScroll();
    }

    setupHorizontalScroll() {
        const serviceItemsContainers = document.querySelectorAll('.service-items');
        
        serviceItemsContainers.forEach(container => {
            // Add smooth scrolling behavior
            let isScrolling = false;
            
            container.addEventListener('wheel', (e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    e.preventDefault();
                    container.scrollLeft += e.deltaY;
                }
            }, { passive: false });

            // Add touch/drag scrolling for mobile
            let startX;
            let scrollStart;

            container.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                scrollStart = container.scrollLeft;
            });

            container.addEventListener('touchmove', (e) => {
                if (!startX) return;
                
                const currentX = e.touches[0].clientX;
                const diff = startX - currentX;
                container.scrollLeft = scrollStart + diff;
            });

            container.addEventListener('touchend', () => {
                startX = null;
                scrollStart = null;
            });
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Space or Enter to like focused post
            if (e.code === 'Space' || e.code === 'Enter') {
                const focusedLikeBtn = document.activeElement.closest('.post')?.querySelector('.like-btn');
                if (focusedLikeBtn && document.activeElement.classList.contains('like-btn')) {
                    e.preventDefault();
                    focusedLikeBtn.click();
                }
            }
            
            // Arrow keys for navigation
            if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
                e.preventDefault();
                this.navigatePosts(e.code === 'ArrowUp' ? -1 : 1);
            }
        });
    }

    navigatePosts(direction) {
        const posts = Array.from(document.querySelectorAll('.post'));
        const currentIndex = posts.findIndex(post => 
            post.getBoundingClientRect().top >= 0 && 
            post.getBoundingClientRect().top < window.innerHeight / 2
        );
        
        let targetIndex = currentIndex + direction;
        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex >= posts.length) targetIndex = posts.length - 1;
        
        posts[targetIndex].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1
        });
        
        document.querySelectorAll('.post').forEach(post => {
            observer.observe(post);
        });
    }

    loadMorePosts() {
        // Infinite scroll simulation
        let loading = false;
        
        window.addEventListener('scroll', () => {
            if (loading) return;
            
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            
            if (scrollTop + clientHeight >= scrollHeight - 1000) {
                loading = true;
                this.showLoadingPosts();
                
                setTimeout(() => {
                    this.addMorePosts();
                    loading = false;
                }, 1000);
            }
        });
    }

    showLoadingPosts() {
        const loading = document.createElement('div');
        loading.className = 'loading-posts';
        loading.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>더 많은 게시물을 불러오는 중...</p>
            </div>
        `;
        
        document.querySelector('.posts-feed').appendChild(loading);
    }

    addMorePosts() {
        const loadingElement = document.querySelector('.loading-posts');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // Add new posts (simulate)
        const postsData = [
            {
                username: 'oadesignstudio',
                image: 'https://via.placeholder.com/470x470/f59e0b/ffffff?text=PPT+Design',
                likes: 156,
                caption: 'PowerPoint 프레젠테이션 디자인 완성! 📊 데이터 시각화와 스토리텔링이 조화를 이룬 전문적인 템플릿입니다.',
                hashtags: ['#PPT디자인', '#프레젠테이션', '#데이터시각화', '#비즈니스'],
                comments: 28,
                time: '5시간 전'
            }
        ];
        
        postsData.forEach(postData => {
            const post = this.createPostElement(postData);
            document.querySelector('.posts-feed').appendChild(post);
        });
        
        // Re-setup event listeners for new posts
        this.setupEventListeners();
    }

    createPostElement(data) {
        const post = document.createElement('article');
        post.className = 'post';
        post.innerHTML = `
            <header class="post-header">
                <div class="post-user">
                    <div class="post-avatar">
                        <img src="https://via.placeholder.com/32/6366f1/ffffff?text=OA" alt="${data.username}">
                    </div>
                    <div class="post-user-info">
                        <span class="post-username">${data.username}</span>
                        <span class="post-location">서울, 대한민국</span>
                    </div>
                </div>
                <button class="post-options">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="2"></circle>
                        <circle cx="12" cy="5" r="2"></circle>
                        <circle cx="12" cy="19" r="2"></circle>
                    </svg>
                </button>
            </header>
            
            <div class="post-image">
                <img src="${data.image}" alt="게시물 이미지">
            </div>
            
            <div class="post-actions">
                <div class="post-actions-left">
                    <button class="action-btn like-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                    <button class="action-btn comment-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </button>
                    <button class="action-btn share-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                            <polyline points="16,6 12,2 8,6"></polyline>
                            <line x1="12" y1="2" x2="12" y2="15"></line>
                        </svg>
                    </button>
                </div>
                <button class="action-btn bookmark-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>
            </div>
            
            <div class="post-content">
                <div class="post-likes">
                    <span class="likes-count">좋아요 ${data.likes}개</span>
                </div>
                <div class="post-caption">
                    <span class="post-username">${data.username}</span>
                    <span class="caption-text">${data.caption}</span>
                </div>
                <div class="post-hashtags">
                    ${data.hashtags.map(tag => `<a href="#" class="hashtag">${tag}</a>`).join(' ')}
                </div>
                <div class="post-comments" data-original-count="${data.comments}">
                    <button class="view-comments">댓글 ${data.comments}개 모두 보기</button>
                </div>
                <div class="post-time">
                    <span>${data.time}</span>
                </div>
            </div>
        `;
        
        return post;
    }

    showLoadingState() {
        document.body.classList.add('loading');
    }

    hideLoadingState() {
        document.body.classList.remove('loading');
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 100);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new InstagramApp();
});

// Add CSS for additional components
const additionalStyles = `
    .story-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .story-modal {
        width: 375px;
        height: 667px;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
    }
    
    .story-header {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%);
        z-index: 2;
    }
    
    .story-user {
        display: flex;
        align-items: center;
        color: white;
    }
    
    .story-avatar-small {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        margin-right: 8px;
    }
    
    .story-avatar-small img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    }
    
    .story-username {
        font-size: 14px;
        font-weight: 600;
        margin-right: 8px;
    }
    
    .story-time {
        font-size: 12px;
        opacity: 0.8;
    }
    
    .story-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .story-content {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .story-content img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .story-progress {
        position: absolute;
        top: 8px;
        left: 16px;
        right: 16px;
        height: 2px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 1px;
    }
    
    .story-progress-bar {
        height: 100%;
        background: white;
        border-radius: 1px;
        width: 0;
        animation: progress 5s linear forwards;
    }
    
    @keyframes progress {
        to { width: 100%; }
    }
    
    .post-options-menu .options-menu {
        background: white;
        border-radius: 12px;
        min-width: 200px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    
    .option-item {
        display: block;
        width: 100%;
        padding: 16px 24px;
        background: none;
        border: none;
        text-align: left;
        font-size: 14px;
        cursor: pointer;
        border-bottom: 1px solid #efefef;
    }
    
    .option-item:last-child {
        border-bottom: none;
    }
    
    .option-item:hover {
        background: #f8f8f8;
    }
    
    .option-item.cancel {
        font-weight: 600;
    }
    
    .comment-input {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding: 8px 0;
        border-top: 1px solid #efefef;
    }
    
    .comment-text {
        flex: 1;
        border: none;
        outline: none;
        font-size: 14px;
        background: none;
    }
    
    .comment-submit {
        background: none;
        border: none;
        color: #0095f6;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
    }
    
    .comment-submit:hover {
        color: #00376b;
    }
    
    .comment {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        font-size: 14px;
    }
    
    .comment-username {
        font-weight: 600;
    }
    
    .comment-like {
        background: none;
        border: none;
        cursor: pointer;
        margin-left: auto;
        font-size: 12px;
    }
    
    .comments-container {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #efefef;
    }
    
    .loading-posts {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40px;
    }
    
    .loading-spinner {
        text-align: center;
    }
    
    .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #8e8e8e;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 12px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .story-item.viewed .story-avatar {
        background: #c7c7c7;
    }
    
    .liked svg {
        fill: #ed4956 !important;
        stroke: #ed4956 !important;
    }
    
    .bookmarked svg {
        fill: currentColor !important;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
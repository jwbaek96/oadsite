/**
 * 홈페이지 JavaScript
 * OA Design Studio - 오에이디자인스튜디오
 */

class HomePage {
    constructor() {
        this.featuredPosts = [];
        this.services = [];
        this.testimonials = [];
        this.init();
    }
    
    /**
     * 초기화
     */
    async init() {
        try {
            await this.loadFeaturedPosts();
            this.setupEventListeners();
            this.setupAnimations();
            this.startAutoSlider();
            
            Utils.log.info('홈페이지 초기화 완료');
        } catch (error) {
            Utils.log.error('홈페이지 초기화 오류:', error);
        }
    }
    
    /**
     * 피처드 포스트 로드
     */
    async loadFeaturedPosts() {
        try {
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.GET_POSTS, {
                method: 'GET',
                data: {
                    featured: true,
                    limit: CONFIG.BLOG.FEATURED_POSTS_COUNT
                }
            });
            
            if (response.success) {
                this.featuredPosts = response.data.posts;
                this.renderFeaturedPosts();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            Utils.log.error('피처드 포스트 로드 실패:', error);
            this.showError('featured-posts-container', '포스트를 불러오는데 실패했습니다.');
        }
    }
    
    /**
     * 피처드 포스트 렌더링
     */
    renderFeaturedPosts() {
        const container = $('#featured-posts-grid');
        if (!container) return;
        
        // 로딩 상태 제거
        container.classList.remove('loading');
        
        if (this.featuredPosts.length === 0) {
            container.innerHTML = '<p class="no-content">표시할 포스트가 없습니다.</p>';
            return;
        }
        
        const postsHtml = this.featuredPosts.map(post => this.createPostCard(post)).join('');
        container.innerHTML = postsHtml;
        
        // 포스트 카드 클릭 이벤트
        container.addEventListener('click', (e) => {
            const postCard = e.target.closest('.post-card');
            if (postCard) {
                const postId = postCard.dataset.postId;
                window.location.href = `post.html?id=${postId}`;
            }
        });
    }
    
    /**
     * 포스트 카드 HTML 생성
     */
    createPostCard(post) {
        const formattedDate = Utils.date.format(post.createdAt, 'YYYY년 MM월 DD일');
        const timeAgo = Utils.date.timeAgo(post.createdAt);
        
        return `
            <article class="post-card" data-post-id="${post.id}">
                <div class="post-thumbnail">
                    <img src="${post.thumbnail || '/assets/images/default-post.jpg'}" 
                         alt="${post.title}" loading="lazy">
                    <div class="post-meta-overlay">
                        <span class="post-category">${post.category}</span>
                        <span class="post-date">${timeAgo}</span>
                    </div>
                </div>
                <div class="post-content">
                    <h3 class="post-title">${post.title}</h3>
                    <p class="post-excerpt">${post.excerpt}</p>
                    <div class="post-meta">
                        <span class="post-author">by ${post.author}</span>
                        <div class="post-stats">
                            <span class="view-count">
                                <i class="icon-eye"></i> ${post.viewCount}
                            </span>
                            <span class="comment-count">
                                <i class="icon-comment"></i> ${post.commentCount}
                            </span>
                        </div>
                    </div>
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </article>
        `;
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // CTA 버튼들
        const ctaButtons = $$('.cta-button');
        ctaButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = button.dataset.action;
                this.handleCTAClick(action, e);
            });
        });
        
        // 서비스 카드 호버 효과
        const serviceCards = $$('.service-card');
        serviceCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('hover');
            });
            
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hover');
            });
        });
        
        // 스크롤 이벤트 (페이지 내비게이션)
        window.addEventListener('scroll', Utils.event.throttle(() => {
            this.updateScrollProgress();
            this.handleScrollAnimations();
        }, 100));
        
        // "더 보기" 버튼
        const viewMoreBtn = $('#view-more-posts');
        if (viewMoreBtn) {
            viewMoreBtn.addEventListener('click', () => {
                window.location.href = 'blog.html';
            });
        }
        
        // 연락하기 폼
        const contactForm = $('#contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                this.handleContactForm(e);
            });
        }
        
        // 뉴스레터 구독
        const newsletterForm = $('#newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                this.handleNewsletterForm(e);
            });
        }
    }
    
    /**
     * CTA 버튼 클릭 처리
     */
    handleCTAClick(action, event) {
        event.preventDefault();
        
        switch (action) {
            case 'view-portfolio':
                window.location.href = 'artwork.html';
                break;
                
            case 'read-blog':
                window.location.href = 'blog.html';
                break;
                
            case 'contact':
                Utils.dom.smoothScrollTo($('#contact-section'), 80);
                break;
                
            case 'get-quote':
                this.showQuoteModal();
                break;
                
            default:
                Utils.log.warn('알 수 없는 CTA 액션:', action);
        }
    }
    
    /**
     * 스크롤 진행도 업데이트
     */
    updateScrollProgress() {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        const progressBar = $('#scroll-progress');
        
        if (progressBar) {
            progressBar.style.width = `${Math.min(scrollPercent, 100)}%`;
        }
    }
    
    /**
     * 스크롤 애니메이션 처리
     */
    handleScrollAnimations() {
        const animationElements = $$('.animate-on-scroll');
        
        animationElements.forEach(element => {
            if (Utils.dom.isInViewport(element, 100)) {
                element.classList.add('animated');
            }
        });
    }
    
    /**
     * 애니메이션 설정
     */
    setupAnimations() {
        // 페이드 인 애니메이션
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });
        
        // 애니메이션 대상 요소들 관찰
        const animationTargets = $$('.hero-content, .service-card, .post-card, .stats-item');
        animationTargets.forEach(target => {
            observer.observe(target);
        });
        
        // 타이핑 애니메이션
        this.startTypingAnimation();
    }
    
    /**
     * 타이핑 애니메이션 시작
     */
    startTypingAnimation() {
        const typingElement = $('#typing-text');
        if (!typingElement) return;
        
        const texts = [
            '창의적인 디자인',
            '사용자 중심 UI/UX',
            '브랜드 아이덴티티',
            '웹사이트 개발'
        ];
        
        let currentIndex = 0;
        let currentText = '';
        let isDeleting = false;
        
        const typeText = () => {
            const fullText = texts[currentIndex];
            
            if (isDeleting) {
                currentText = fullText.substring(0, currentText.length - 1);
            } else {
                currentText = fullText.substring(0, currentText.length + 1);
            }
            
            typingElement.textContent = currentText;
            
            let typeSpeed = isDeleting ? 50 : 100;
            
            if (!isDeleting && currentText === fullText) {
                typeSpeed = 2000; // 완성된 텍스트 표시 시간
                isDeleting = true;
            } else if (isDeleting && currentText === '') {
                isDeleting = false;
                currentIndex = (currentIndex + 1) % texts.length;
                typeSpeed = 500;
            }
            
            setTimeout(typeText, typeSpeed);
        };
        
        typeText();
    }
    
    /**
     * 자동 슬라이더 시작
     */
    startAutoSlider() {
        const testimonials = $$('.testimonial-slide');
        if (testimonials.length === 0) return;
        
        let currentSlide = 0;
        
        const showSlide = (index) => {
            testimonials.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
        };
        
        const nextSlide = () => {
            currentSlide = (currentSlide + 1) % testimonials.length;
            showSlide(currentSlide);
        };
        
        // 초기 슬라이드 표시
        showSlide(0);
        
        // 5초마다 슬라이드 변경
        setInterval(nextSlide, 5000);
        
        // 슬라이드 인디케이터 클릭 이벤트
        const indicators = $$('.testimonial-indicator');
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
            });
        });
    }
    
    /**
     * 연락 폼 처리
     */
    async handleContactForm(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // 로딩 상태
        submitBtn.textContent = '전송 중...';
        submitBtn.disabled = true;
        
        try {
            const contactData = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message'),
                timestamp: new Date().toISOString()
            };
            
            // 이메일 유효성 검사
            if (!this.validateEmail(contactData.email)) {
                throw new Error('올바른 이메일 주소를 입력해주세요.');
            }
            
            // API 요청 (실제로는 Google Apps Script로 이메일 전송)
            const response = await SheetsAPI.request('/api/contact', {
                method: 'POST',
                data: contactData
            });
            
            if (response.success) {
                this.showSuccessMessage('문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.');
                form.reset();
            } else {
                throw new Error(response.message || '문의 전송에 실패했습니다.');
            }
            
        } catch (error) {
            Utils.log.error('연락 폼 전송 오류:', error);
            this.showErrorMessage(error.message);
        } finally {
            // 버튼 상태 복원
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    /**
     * 뉴스레터 구독 처리
     */
    async handleNewsletterForm(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const email = formData.get('email');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        if (!this.validateEmail(email)) {
            this.showErrorMessage('올바른 이메일 주소를 입력해주세요.');
            return;
        }
        
        // 로딩 상태
        submitBtn.textContent = '구독 중...';
        submitBtn.disabled = true;
        
        try {
            const response = await SheetsAPI.request('/api/newsletter/subscribe', {
                method: 'POST',
                data: {
                    email,
                    timestamp: new Date().toISOString()
                }
            });
            
            if (response.success) {
                this.showSuccessMessage('뉴스레터 구독이 완료되었습니다!');
                form.reset();
            } else {
                throw new Error(response.message || '구독에 실패했습니다.');
            }
            
        } catch (error) {
            Utils.log.error('뉴스레터 구독 오류:', error);
            this.showErrorMessage(error.message);
        } finally {
            // 버튼 상태 복원
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    /**
     * 견적 요청 모달 표시
     */
    showQuoteModal() {
        const modal = $('#quote-modal');
        if (modal) {
            modal.style.display = 'block';
            
            // 모달 닫기 이벤트
            const closeBtn = modal.querySelector('.close');
            const cancelBtn = modal.querySelector('.btn-cancel');
            
            [closeBtn, cancelBtn].forEach(btn => {
                if (btn) {
                    btn.addEventListener('click', () => {
                        modal.style.display = 'none';
                    });
                }
            });
            
            // 모달 외부 클릭 시 닫기
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
            
            // 견적 요청 폼 처리
            const quoteForm = modal.querySelector('#quote-form');
            if (quoteForm) {
                quoteForm.addEventListener('submit', (e) => {
                    this.handleQuoteForm(e);
                });
            }
        }
    }
    
    /**
     * 견적 요청 폼 처리
     */
    async handleQuoteForm(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // 로딩 상태
        submitBtn.textContent = '전송 중...';
        submitBtn.disabled = true;
        
        try {
            const quoteData = {
                name: formData.get('name'),
                email: formData.get('email'),
                company: formData.get('company'),
                project_type: formData.get('project_type'),
                budget: formData.get('budget'),
                timeline: formData.get('timeline'),
                description: formData.get('description'),
                timestamp: new Date().toISOString()
            };
            
            const response = await SheetsAPI.request('/api/quote', {
                method: 'POST',
                data: quoteData
            });
            
            if (response.success) {
                this.showSuccessMessage('견적 요청이 접수되었습니다. 1-2일 내에 답변드리겠습니다.');
                form.reset();
                $('#quote-modal').style.display = 'none';
            } else {
                throw new Error(response.message || '견적 요청 전송에 실패했습니다.');
            }
            
        } catch (error) {
            Utils.log.error('견적 요청 오류:', error);
            this.showErrorMessage(error.message);
        } finally {
            // 버튼 상태 복원
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
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
    showError(containerId, message) {
        const container = $(`#${containerId}`);
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p>${message}</p>
                    <button onclick="location.reload()">다시 시도</button>
                </div>
            `;
        }
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.homePage = new HomePage();
});
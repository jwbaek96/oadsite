/**
 * 템플릿 로더 JavaScript
 * OA Design Studio - 오에이디자인스튜디오
 */

class TemplateLoader {
    constructor() {
        this.cache = new Map();
        this.basePath = './templates/';
    }
    
    /**
     * 템플릿 로드
     */
    async loadTemplate(templateName) {
        // 캐시에서 확인
        if (this.cache.has(templateName)) {
            return this.cache.get(templateName);
        }
        
        try {
            const response = await fetch(`${this.basePath}${templateName}.html`);
            
            if (!response.ok) {
                throw new Error(`템플릿 로드 실패: ${templateName} (${response.status})`);
            }
            
            let html = await response.text();
            
            // Live Server 스크립트 제거
            html = this.cleanLiveServerScript(html);
            
            // 캐시에 저장
            this.cache.set(templateName, html);
            
            return html;
            
        } catch (error) {
            Utils.log.error(`템플릿 로드 오류 (${templateName}):`, error);
            throw error;
        }
    }
    
    /**
     * Live Server 스크립트 제거
     */
    cleanLiveServerScript(html) {
        // Live Server가 삽입하는 스크립트와 잘못된 HTML 구조 정리
        return html
            // Live Server 스크립트 완전 제거 (모든 패턴)
            .replace(/<!-- Code injected by live-server -->[\s\S]*?<\/script>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?live-server[\s\S]*?<\/script>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?WebSocket[\s\S]*?<\/script>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?refreshCSS[\s\S]*?<\/script>/gi, '')
            // SVG 내부의 스크립트 태그 제거
            .replace(/(<svg[^>]*>[\s\S]*?)<script[\s\S]*?<\/script>([\s\S]*?<\/svg>)/gi, '$1$2')
            // 불완전한 스크립트 태그 제거
            .replace(/<script[^>]*>[\s\S]*?if \(/gi, '')
            .replace(/else if[\s\S]*?<\/script>/gi, '')
            // HTML 엔티티 복원
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            // 잘못된 태그 닫힘 수정
            .replace(/<\/svg><\/a><\/div><\/div><\/div><\/div><\/footer>/g, '</svg></a></div></div></div></div></footer>')
            // 여러 줄바꿈 정리
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // 잘못된 HTML 구조 정리
            .replace(/\s+<\/svg>/g, '</svg>')
            .replace(/><\/svg>/g, '></path></svg>')
            .trim();
    }
    
    /**
     * 템플릿을 특정 요소에 삽입
     */
    async insertTemplate(templateName, targetSelector, options = {}) {
        try {
            const target = typeof targetSelector === 'string' 
                ? document.querySelector(targetSelector)
                : targetSelector;
                
            if (!target) {
                throw new Error(`대상 요소를 찾을 수 없습니다: ${targetSelector}`);
            }
            
            const html = await this.loadTemplate(templateName);
            
            // 삽입 방식 결정
            const insertMethod = options.insertMethod || 'innerHTML';
            
            switch (insertMethod) {
                case 'innerHTML':
                    target.innerHTML = html;
                    break;
                case 'insertAdjacentHTML':
                    target.insertAdjacentHTML(options.position || 'beforeend', html);
                    break;
                case 'append':
                    // DOM 파서를 사용하여 올바른 HTML 구조 생성
                    const parser = new DOMParser();
                    
                    // HTML을 더 정제하여 파싱
                    let cleanHtml = html;
                    
                    // 임시 컨테이너로 감싸서 파싱 안정성 향상
                    const tempContainer = document.createElement('div');
                    tempContainer.innerHTML = cleanHtml;
                    
                    // 자식 요소들을 대상에 추가
                    while (tempContainer.firstChild) {
                        const child = tempContainer.firstChild;
                        target.appendChild(child);
                    }
                    break;
                default:
                    target.innerHTML = html;
            }
            
            // 템플릿 변수 치환
            if (options.variables) {
                this.replaceVariables(target, options.variables);
            }
            
            // 후처리 함수 실행
            if (options.callback && typeof options.callback === 'function') {
                options.callback(target);
            }
            
            // 커스텀 이벤트 발생
            const event = new CustomEvent('templateLoaded', {
                detail: { templateName, target, options }
            });
            document.dispatchEvent(event);
            
            Utils.log.info(`템플릿 로드 완료: ${templateName}`);
            
        } catch (error) {
            Utils.log.error(`템플릿 삽입 오류 (${templateName}):`, error);
            throw error;
        }
    }
    
    /**
     * 템플릿 변수 치환
     */
    replaceVariables(element, variables) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        textNodes.forEach(textNode => {
            let text = textNode.textContent;
            
            // {{variable}} 형태의 변수 치환
            Object.keys(variables).forEach(key => {
                const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
                text = text.replace(regex, variables[key]);
            });
            
            if (text !== textNode.textContent) {
                textNode.textContent = text;
            }
        });
        
        // 속성의 변수도 치환
        const elementsWithAttrs = element.querySelectorAll('[href*="{{"], [src*="{{"], [alt*="{{"]');
        elementsWithAttrs.forEach(el => {
            ['href', 'src', 'alt', 'title'].forEach(attr => {
                if (el.hasAttribute(attr)) {
                    let attrValue = el.getAttribute(attr);
                    Object.keys(variables).forEach(key => {
                        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
                        attrValue = attrValue.replace(regex, variables[key]);
                    });
                    el.setAttribute(attr, attrValue);
                }
            });
        });
    }
    
    /**
     * 푸터 로드 (특별한 처리)
     */
    async loadFooter(targetSelector = 'body', options = {}) {
        const defaultOptions = {
            insertMethod: 'append',
            variables: {
                currentYear: new Date().getFullYear()
            },
            callback: (target) => {
                // DOM에서 실제 요소들을 찾기 (약간의 지연 후)
                setTimeout(() => {
                    // 현재 연도 업데이트
                    const yearElement = document.querySelector('#current-year');
                    if (yearElement) {
                        yearElement.textContent = new Date().getFullYear();
                    }
                    
                    // Back to top 버튼 기능
                    const backToTopBtn = document.querySelector('#back-to-top');
                    if (backToTopBtn && !backToTopBtn.hasAttribute('data-initialized')) {
                        backToTopBtn.setAttribute('data-initialized', 'true');
                        
                        backToTopBtn.addEventListener('click', () => {
                            window.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                            });
                        });
                        
                        // 스크롤 이벤트로 버튼 표시/숨김
                        const handleScroll = () => {
                            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                            backToTopBtn.style.display = scrollTop > 300 ? 'flex' : 'none';
                        };
                        
                        window.addEventListener('scroll', handleScroll);
                        handleScroll(); // 초기 상태 설정
                    }
                }, 50);
                
                // 소셜 링크 트래킹 (옵션)
                const socialLinks = target.querySelectorAll('.social-link');
                socialLinks.forEach(link => {
                    link.addEventListener('click', (e) => {
                        const platform = link.getAttribute('aria-label');
                        Utils.log.info(`소셜 링크 클릭: ${platform}`);
                        
                        // 분석 도구 연동 가능
                        if (typeof gtag !== 'undefined') {
                            gtag('event', 'social_click', {
                                'platform': platform
                            });
                        }
                    });
                });
            }
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        return await this.insertTemplate('footer', targetSelector, mergedOptions);
    }
    
    /**
     * 헤더 로드 (향후 확장용)
     */
    async loadHeader(targetSelector = 'body', options = {}) {
        const defaultOptions = {
            insertMethod: 'insertAdjacentHTML',
            position: 'afterbegin',
            callback: (target) => {
                // 헤더 특별 처리 로직
            }
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        return await this.insertTemplate('header', targetSelector, mergedOptions);
    }
    
    /**
     * 캐시 클리어
     */
    clearCache() {
        this.cache.clear();
        Utils.log.info('템플릿 캐시가 클리어되었습니다.');
    }
    
    /**
     * 강제 템플릿 리로드 (캐시 무시)
     */
    async forceReloadTemplate(templateName) {
        // 캐시에서 제거
        this.cache.delete(templateName);
        
        // 브라우저 캐시 우회를 위한 쿼리 파라미터 추가
        const timestamp = Date.now();
        const url = `${this.basePath}${templateName}.html?_t=${timestamp}`;
        
        try {
            const response = await fetch(url, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`템플릿 강제 로드 실패: ${templateName} (${response.status})`);
            }
            
            let html = await response.text();
            html = this.cleanLiveServerScript(html);
            
            // 새로운 내용을 캐시에 저장
            this.cache.set(templateName, html);
            
            return html;
            
        } catch (error) {
            Utils.log.error(`템플릿 강제 로드 오류 (${templateName}):`, error);
            throw error;
        }
    }
    
    /**
     * 캐시 상태 확인
     */
    getCacheInfo() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// 전역 인스턴스 생성
window.templateLoader = new TemplateLoader();

/**
 * 간편한 템플릿 로드 함수들
 */
window.loadFooter = async function(target, options) {
    return await templateLoader.loadFooter(target, options);
};

window.loadHeader = async function(target, options) {
    return await templateLoader.loadHeader(target, options);
};

window.loadTemplate = async function(templateName, target, options) {
    return await templateLoader.insertTemplate(templateName, target, options);
};

// 페이지 로드 시 자동으로 푸터 로드 (옵션)
document.addEventListener('DOMContentLoaded', async () => {
    // 자동 로드를 원하지 않는 페이지는 data-no-auto-footer 속성 추가
    if (!document.body.hasAttribute('data-no-auto-footer')) {
        try {
            // 개발 환경에서는 강제 리로드
            const isDevelopment = window.location.hostname === 'localhost' || 
                                window.location.hostname === '127.0.0.1' ||
                                window.location.protocol === 'file:';
            
            if (isDevelopment) {
                console.log('개발 환경: 푸터 템플릿 강제 리로드');
                await templateLoader.forceReloadTemplate('footer');
            }
            
            await loadFooter();
            
        } catch (error) {
            console.warn('자동 푸터 로드 실패:', error);
            
            // 폴백: 기본 푸터 HTML 삽입
            const fallbackFooter = `
                <footer class="footer" role="contentinfo" id="contact">
                    <div class="container">
                        <div class="footer-content">
                            <div class="footer-section">
                                <h3 class="footer-title">OA Design Studio</h3>
                                <p class="footer-description">창의적인 디자인으로 브랜드 스토리를 만들어갑니다.</p>
                            </div>
                        </div>
                        <div class="footer-bottom">
                            <p class="copyright">&copy; 2024 OA Design Studio. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            `;
            document.body.insertAdjacentHTML('beforeend', fallbackFooter);
        }
    }
});

// 템플릿 로드 완료 이벤트 리스너 예제
document.addEventListener('templateLoaded', (e) => {
    const { templateName, target } = e.detail;
    Utils.log.info(`템플릿 로드 이벤트: ${templateName}`, target);
});
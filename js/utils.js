/**
 * 유틸리티 함수 모음
 * OA Design Studio - 오에이디자인스튜디오
 */

/**
 * 유틸리티 네임스페이스
 */
window.Utils = {
    
    /**
     * DOM 조작 유틸리티
     */
    dom: {
        /**
         * 요소 선택
         */
        $(selector, parent = document) {
            return parent.querySelector(selector);
        },
        
        /**
         * 여러 요소 선택
         */
        $$(selector, parent = document) {
            return Array.from(parent.querySelectorAll(selector));
        },
        
        /**
         * 요소 생성
         */
        create(tag, attributes = {}, content = '') {
            const element = document.createElement(tag);
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else if (key.startsWith('data-')) {
                    element.setAttribute(key, value);
                } else {
                    element[key] = value;
                }
            });
            
            if (content) {
                element.textContent = content;
            }
            
            return element;
        },
        
        /**
         * 요소에 클래스 토글
         */
        toggleClass(element, className, force = null) {
            if (force !== null) {
                element.classList.toggle(className, force);
            } else {
                element.classList.toggle(className);
            }
        },
        
        /**
         * 요소가 뷰포트에 보이는지 확인
         */
        isInViewport(element, threshold = 0) {
            const rect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const windowWidth = window.innerWidth || document.documentElement.clientWidth;
            
            return (
                rect.top >= -threshold &&
                rect.left >= -threshold &&
                rect.bottom <= windowHeight + threshold &&
                rect.right <= windowWidth + threshold
            );
        },
        
        /**
         * 부드러운 스크롤
         */
        smoothScrollTo(element, offset = 0) {
            const targetPosition = element.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    },
    
    /**
     * 문자열 유틸리티
     */
    string: {
        /**
         * HTML 태그 제거
         */
        stripHtml(html) {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        },
        
        /**
         * 텍스트 자르기
         */
        truncate(text, length, suffix = '...') {
            if (text.length <= length) return text;
            return text.substring(0, length - suffix.length) + suffix;
        },
        
        /**
         * 슬러그 생성 (URL 친화적 문자열)
         */
        slugify(text) {
            return text
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '') // 특수문자 제거
                .replace(/[\s_-]+/g, '-') // 공백을 하이픈으로
                .replace(/^-+|-+$/g, ''); // 앞뒤 하이픈 제거
        },
        
        /**
         * 검색어 하이라이트
         */
        highlight(text, query) {
            if (!query) return text;
            const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        },
        
        /**
         * 정규식 특수문자 이스케이프
         */
        escapeRegex(text) {
            return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },
        
        /**
         * 카멜케이스를 케밥케이스로 변환
         */
        camelToKebab(str) {
            return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        },
        
        /**
         * 케밥케이스를 카멜케이스로 변환
         */
        kebabToCamel(str) {
            return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
        }
    },
    
    /**
     * 날짜/시간 유틸리티
     */
    date: {
        /**
         * 날짜 포맷팅
         */
        format(date, format = 'YYYY-MM-DD') {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes)
                .replace('ss', seconds);
        },
        
        /**
         * 상대적 시간 표시 (예: 2시간 전)
         */
        timeAgo(date) {
            const now = new Date();
            const past = new Date(date);
            const diffMs = now - past;
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);
            const diffWeeks = Math.floor(diffDays / 7);
            const diffMonths = Math.floor(diffDays / 30);
            const diffYears = Math.floor(diffDays / 365);
            
            if (diffSeconds < 60) return '방금 전';
            if (diffMinutes < 60) return `${diffMinutes}분 전`;
            if (diffHours < 24) return `${diffHours}시간 전`;
            if (diffDays < 7) return `${diffDays}일 전`;
            if (diffWeeks < 4) return `${diffWeeks}주 전`;
            if (diffMonths < 12) return `${diffMonths}개월 전`;
            return `${diffYears}년 전`;
        },
        
        /**
         * ISO 날짜 문자열을 로컬 형식으로 변환
         */
        toLocal(isoString) {
            const date = new Date(isoString);
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
        }
    },
    
    /**
     * 배열/객체 유틸리티
     */
    data: {
        /**
         * 배열에서 중복 제거
         */
        unique(array, key = null) {
            if (!key) {
                return [...new Set(array)];
            }
            const seen = new Set();
            return array.filter(item => {
                const value = item[key];
                if (seen.has(value)) return false;
                seen.add(value);
                return true;
            });
        },
        
        /**
         * 배열 셔플
         */
        shuffle(array) {
            const result = [...array];
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
            return result;
        },
        
        /**
         * 객체 깊은 복사
         */
        deepClone(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj);
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));
            if (typeof obj === 'object') {
                const copy = {};
                Object.keys(obj).forEach(key => {
                    copy[key] = this.deepClone(obj[key]);
                });
                return copy;
            }
        },
        
        /**
         * 배열 그룹화
         */
        groupBy(array, key) {
            return array.reduce((groups, item) => {
                const group = item[key];
                if (!groups[group]) groups[group] = [];
                groups[group].push(item);
                return groups;
            }, {});
        },
        
        /**
         * 배열 청크 분할
         */
        chunk(array, size) {
            const chunks = [];
            for (let i = 0; i < array.length; i += size) {
                chunks.push(array.slice(i, i + size));
            }
            return chunks;
        }
    },
    
    /**
     * 파일/미디어 유틸리티
     */
    file: {
        /**
         * 파일 크기를 읽기 쉬운 형식으로 변환
         */
        formatSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        /**
         * 파일 타입 검증
         */
        validateType(file, allowedTypes) {
            return allowedTypes.includes(file.type);
        },
        
        /**
         * 이미지 파일 검증
         */
        isImage(file) {
            return CONFIG.MEDIA.ALLOWED_IMAGE_TYPES.includes(file.type);
        },
        
        /**
         * 비디오 파일 검증
         */
        isVideo(file) {
            return CONFIG.MEDIA.ALLOWED_VIDEO_TYPES.includes(file.type);
        },
        
        /**
         * 파일을 Base64로 변환
         */
        async toBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        },
        
        /**
         * 이미지 리사이즈
         */
        async resizeImage(file, maxWidth = 1200, maxHeight = 800, quality = 0.8) {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                    // 비율 계산
                    let { width, height } = img;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(resolve, 'image/jpeg', quality);
                };
                
                img.src = URL.createObjectURL(file);
            });
        }
    },
    
    /**
     * URL/라우팅 유틸리티
     */
    url: {
        /**
         * URL 파라미터 가져오기
         */
        getParam(name, url = window.location.href) {
            const urlObj = new URL(url);
            return urlObj.searchParams.get(name);
        },
        
        /**
         * URL 파라미터 설정
         */
        setParam(name, value, url = window.location.href) {
            const urlObj = new URL(url);
            urlObj.searchParams.set(name, value);
            return urlObj.toString();
        },
        
        /**
         * URL 파라미터 제거
         */
        removeParam(name, url = window.location.href) {
            const urlObj = new URL(url);
            urlObj.searchParams.delete(name);
            return urlObj.toString();
        },
        
        /**
         * 해시 파라미터 가져오기
         */
        getHashParam(name) {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            return params.get(name);
        },
        
        /**
         * 현재 페이지 식별
         */
        getCurrentPage() {
            const path = window.location.pathname;
            const filename = path.split('/').pop() || 'index.html';
            return filename.replace('.html', '');
        }
    },
    
    /**
     * 이벤트 유틸리티
     */
    event: {
        /**
         * 디바운스 함수
         */
        debounce(func, wait, immediate = false) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) func.apply(this, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(this, args);
            };
        },
        
        /**
         * 쓰로틀 함수
         */
        throttle(func, limit) {
            let inThrottle;
            return function executedFunction(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        /**
         * 한 번만 실행되는 함수
         */
        once(func) {
            let called = false;
            return function executedFunction(...args) {
                if (!called) {
                    called = true;
                    return func.apply(this, args);
                }
            };
        }
    },
    
    /**
     * 로컬 스토리지 유틸리티
     */
    storage: {
        /**
         * 데이터 저장
         */
        set(key, value, expiry = null) {
            const item = {
                value,
                timestamp: Date.now(),
                expiry: expiry ? Date.now() + expiry : null
            };
            localStorage.setItem(key, JSON.stringify(item));
        },
        
        /**
         * 데이터 가져오기
         */
        get(key) {
            try {
                const item = localStorage.getItem(key);
                if (!item) return null;
                
                const parsed = JSON.parse(item);
                
                // 만료 확인
                if (parsed.expiry && Date.now() > parsed.expiry) {
                    localStorage.removeItem(key);
                    return null;
                }
                
                return parsed.value;
            } catch (error) {
                console.warn('스토리지 데이터 파싱 오류:', error);
                return null;
            }
        },
        
        /**
         * 데이터 제거
         */
        remove(key) {
            localStorage.removeItem(key);
        },
        
        /**
         * 모든 데이터 제거
         */
        clear() {
            localStorage.clear();
        },
        
        /**
         * 스토리지 크기 확인
         */
        getSize() {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length;
                }
            }
            return total;
        }
    },
    
    /**
     * 성능 유틸리티
     */
    performance: {
        /**
         * 실행 시간 측정
         */
        measure(name, func) {
            const start = performance.now();
            const result = func();
            const end = performance.now();
            
            if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.SHOW_PERFORMANCE) {
                console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
            }
            
            return result;
        },
        
        /**
         * 비동기 함수 실행 시간 측정
         */
        async measureAsync(name, func) {
            const start = performance.now();
            const result = await func();
            const end = performance.now();
            
            if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.SHOW_PERFORMANCE) {
                console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
            }
            
            return result;
        }
    },
    
    /**
     * 로깅 유틸리티
     */
    log: {
        debug(...args) {
            if (CONFIG.DEBUG.ENABLED && ['debug'].includes(CONFIG.DEBUG.LOG_LEVEL)) {
                console.log('🐛', ...args);
            }
        },
        
        info(...args) {
            if (CONFIG.DEBUG.ENABLED && ['debug', 'info'].includes(CONFIG.DEBUG.LOG_LEVEL)) {
                console.info('ℹ️', ...args);
            }
        },
        
        warn(...args) {
            if (CONFIG.DEBUG.ENABLED && ['debug', 'info', 'warn'].includes(CONFIG.DEBUG.LOG_LEVEL)) {
                console.warn('⚠️', ...args);
            }
        },
        
        error(...args) {
            console.error('❌', ...args);
        }
    }
};

// 전역 단축키 설정
window.$ = Utils.dom.$;
window.$$ = Utils.dom.$$;
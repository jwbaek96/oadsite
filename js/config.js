/**
 * 블로그 애플리케이션 설정 파일
 * OA Design Studio - 오에이디자인스튜디오
 */

// 기본 설정
const CONFIG = {
    // 사이트 정보
    SITE_NAME: 'OA Design Studio',
    SITE_NAME_KO: '오에이디자인스튜디오',
    SITE_URL: 'https://oadsite.github.io',
    VERSION: '1.0.0',
    
    // Google Apps Script 설정
    APPS_SCRIPT: {
        WEB_APP_URL: '', // 배포 후 웹앱 URL로 업데이트 필요
        SCRIPT_ID: '', // Google Apps Script 프로젝트 ID
        TIMEOUT: 30000, // 요청 타임아웃 (30초)
    },
    
    // Google Sheets 설정
    SHEETS: {
        POSTS_SHEET_ID: '', // 포스트 데이터 시트 ID
        COMMENTS_SHEET_ID: '', // 댓글 데이터 시트 ID
        SETTINGS_SHEET_ID: '', // 설정 데이터 시트 ID
        ARTWORK_SHEET_ID: '', // 아트워크 데이터 시트 ID
    },
    
    // 블로그 설정
    BLOG: {
        POSTS_PER_PAGE: 9,
        EXCERPT_LENGTH: 150,
        FEATURED_POSTS_COUNT: 3,
        RECENT_POSTS_COUNT: 5,
        ENABLE_COMMENTS: true,
        ENABLE_SOCIAL_SHARING: true,
        ENABLE_SEARCH: true,
        AUTO_SAVE_INTERVAL: 30000, // 30초마다 자동 저장
    },
    
    // 미디어 설정
    MEDIA: {
        MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
        MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
        THUMBNAIL_SIZES: {
            small: { width: 300, height: 200 },
            medium: { width: 600, height: 400 },
            large: { width: 1200, height: 800 }
        }
    },
    
    // 에디터 설정
    EDITOR: {
        TOOLBAR_ITEMS: [
            'bold', 'italic', 'underline', 'strikethrough',
            'heading1', 'heading2', 'heading3',
            'paragraph', 'blockquote', 'code',
            'unordered-list', 'ordered-list',
            'link', 'image', 'video',
            'table', 'horizontal-rule',
            'undo', 'redo'
        ],
        AUTO_SAVE: true,
        SPELL_CHECK: true,
        WORD_COUNT: true,
    },
    
    // 아트워크 갤러리 설정
    ARTWORK: {
        ITEMS_PER_PAGE: 12,
        MASONRY_COLUMNS: {
            mobile: 1,
            tablet: 2,
            desktop: 3,
            wide: 4
        },
        LIGHTBOX_ENABLED: true,
        CATEGORIES: ['전체', '웹디자인', '그래픽디자인', 'UI/UX', '브랜딩', '일러스트']
    },
    
    // 검색 설정
    SEARCH: {
        MIN_QUERY_LENGTH: 2,
        MAX_RESULTS: 20,
        DEBOUNCE_DELAY: 300,
        FIELDS: ['title', 'content', 'tags', 'category']
    },
    
    // 캐시 설정
    CACHE: {
        POSTS_TTL: 5 * 60 * 1000, // 5분
        COMMENTS_TTL: 2 * 60 * 1000, // 2분
        SETTINGS_TTL: 30 * 60 * 1000, // 30분
        ENABLE_LOCAL_STORAGE: true,
        MAX_CACHE_SIZE: 10 * 1024 * 1024 // 10MB
    },
    
    // API 엔드포인트
    API: {
        ENDPOINTS: {
            // 포스트 관련
            GET_POSTS: '/api/posts',
            GET_POST: '/api/post',
            CREATE_POST: '/api/post/create',
            UPDATE_POST: '/api/post/update',
            DELETE_POST: '/api/post/delete',
            
            // 댓글 관련
            GET_COMMENTS: '/api/comments',
            CREATE_COMMENT: '/api/comment/create',
            DELETE_COMMENT: '/api/comment/delete',
            
            // 미디어 관련
            UPLOAD_IMAGE: '/api/upload/image',
            UPLOAD_VIDEO: '/api/upload/video',
            DELETE_MEDIA: '/api/media/delete',
            
            // 아트워크 관련
            GET_ARTWORK: '/api/artwork',
            CREATE_ARTWORK: '/api/artwork/create',
            UPDATE_ARTWORK: '/api/artwork/update',
            DELETE_ARTWORK: '/api/artwork/delete',
            
            // 검색
            SEARCH: '/api/search',
            
            // 설정
            GET_SETTINGS: '/api/settings',
            UPDATE_SETTINGS: '/api/settings/update'
        }
    },
    
    // 소셜 미디어
    SOCIAL: {
        FACEBOOK: '',
        INSTAGRAM: '',
        TWITTER: '',
        LINKEDIN: '',
        BEHANCE: '',
        DRIBBBLE: '',
        GITHUB: 'https://github.com/oadsite'
    },
    
    // 연락처 정보
    CONTACT: {
        EMAIL: 'contact@oadstudio.com',
        PHONE: '+82-10-0000-0000',
        ADDRESS: '서울특별시 강남구',
        BUSINESS_HOURS: '평일 09:00 - 18:00'
    },
    
    // 테마 설정
    THEME: {
        DEFAULT_MODE: 'light', // 'light' 또는 'dark'
        ENABLE_THEME_TOGGLE: true,
        AUTO_DETECT_SYSTEM_THEME: true
    },
    
    // 분석 도구
    ANALYTICS: {
        GOOGLE_ANALYTICS_ID: '', // GA4 측정 ID
        ENABLE_TRACKING: false // 개발 중에는 false
    },
    
    // 개발 모드 설정
    DEBUG: {
        ENABLED: true, // 배포 시 false로 변경
        LOG_LEVEL: 'info', // 'error', 'warn', 'info', 'debug'
        SHOW_PERFORMANCE: true,
        ENABLE_MOCK_DATA: true // 개발 중 목업 데이터 사용
    }
};

// 환경별 설정 오버라이드
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // 로컬 개발 환경
    CONFIG.DEBUG.ENABLED = true;
    CONFIG.DEBUG.LOG_LEVEL = 'debug';
    CONFIG.ANALYTICS.ENABLE_TRACKING = false;
} else if (window.location.hostname.includes('github.io')) {
    // GitHub Pages 프로덕션 환경
    CONFIG.DEBUG.ENABLED = false;
    CONFIG.DEBUG.LOG_LEVEL = 'error';
    CONFIG.DEBUG.ENABLE_MOCK_DATA = false;
    CONFIG.ANALYTICS.ENABLE_TRACKING = true;
}

// 설정 값 검증 함수
function validateConfig() {
    const errors = [];
    
    // 필수 설정 검증
    if (!CONFIG.APPS_SCRIPT.WEB_APP_URL && !CONFIG.DEBUG.ENABLE_MOCK_DATA) {
        errors.push('Google Apps Script Web App URL이 설정되지 않았습니다.');
    }
    
    if (!CONFIG.SHEETS.POSTS_SHEET_ID && !CONFIG.DEBUG.ENABLE_MOCK_DATA) {
        errors.push('포스트 시트 ID가 설정되지 않았습니다.');
    }
    
    // 미디어 크기 검증
    if (CONFIG.MEDIA.MAX_IMAGE_SIZE <= 0) {
        errors.push('이미지 최대 크기는 0보다 커야 합니다.');
    }
    
    if (CONFIG.MEDIA.MAX_VIDEO_SIZE <= 0) {
        errors.push('비디오 최대 크기는 0보다 커야 합니다.');
    }
    
    // 블로그 설정 검증
    if (CONFIG.BLOG.POSTS_PER_PAGE <= 0) {
        errors.push('페이지당 포스트 수는 0보다 커야 합니다.');
    }
    
    if (errors.length > 0) {
        console.error('설정 검증 오류:', errors);
        return false;
    }
    
    return true;
}

// 설정 업데이트 함수
function updateConfig(newConfig) {
    try {
        Object.assign(CONFIG, newConfig);
        
        // 로컬 스토리지에 사용자 설정 저장
        if (CONFIG.CACHE.ENABLE_LOCAL_STORAGE) {
            localStorage.setItem('oad_blog_config', JSON.stringify({
                theme: CONFIG.THEME,
                social: CONFIG.SOCIAL,
                contact: CONFIG.CONTACT
            }));
        }
        
        return true;
    } catch (error) {
        console.error('설정 업데이트 오류:', error);
        return false;
    }
}

// 로컬 스토리지에서 사용자 설정 로드
function loadUserConfig() {
    try {
        if (CONFIG.CACHE.ENABLE_LOCAL_STORAGE) {
            const userConfig = localStorage.getItem('oad_blog_config');
            if (userConfig) {
                const parsed = JSON.parse(userConfig);
                Object.assign(CONFIG, parsed);
            }
        }
    } catch (error) {
        console.warn('사용자 설정 로드 실패:', error);
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadUserConfig();
    
    if (!validateConfig()) {
        console.warn('일부 설정이 올바르지 않습니다. 기본값을 사용합니다.');
    }
    
    if (CONFIG.DEBUG.ENABLED) {
        console.log('OA Design Studio 블로그 초기화됨', CONFIG);
    }
});

// 전역으로 노출
window.CONFIG = CONFIG;
window.updateConfig = updateConfig;
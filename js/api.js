/**
 * Google Sheets API 통신 모듈
 * OA Design Studio - 오에이디자인스튜디오
 */

/**
 * Google Sheets API 관리자
 */
class SheetsAPI {
    constructor() {
        this.baseUrl = CONFIG.APPS_SCRIPT.WEB_APP_URL;
        this.timeout = CONFIG.APPS_SCRIPT.TIMEOUT;
        this.cache = new Map();
        this.pendingRequests = new Map();
    }
    
    /**
     * API 요청 실행
     */
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            data = null,
            useCache = true,
            cacheTTL = CONFIG.CACHE.POSTS_TTL
        } = options;
        
        // 캐시 키 생성
        const cacheKey = `${method}:${endpoint}:${JSON.stringify(data)}`;
        
        // 캐시된 데이터 확인 (GET 요청만)
        if (method === 'GET' && useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < cacheTTL) {
                Utils.log.debug('캐시된 데이터 반환:', endpoint);
                return cached.data;
            } else {
                this.cache.delete(cacheKey);
            }
        }
        
        // 중복 요청 방지
        if (this.pendingRequests.has(cacheKey)) {
            Utils.log.debug('진행 중인 요청 대기:', endpoint);
            return await this.pendingRequests.get(cacheKey);
        }
        
        // 요청 생성
        const requestPromise = this.executeRequest(endpoint, method, data);
        this.pendingRequests.set(cacheKey, requestPromise);
        
        try {
            const result = await requestPromise;
            
            // 성공한 GET 요청 결과 캐시
            if (method === 'GET' && useCache && result.success) {
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
            }
            
            return result;
            
        } catch (error) {
            Utils.log.error('API 요청 실패:', endpoint, error);
            throw error;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }
    
    /**
     * 실제 HTTP 요청 실행
     */
    async executeRequest(endpoint, method, data) {
        // 개발 모드에서는 목업 데이터 사용
        if (CONFIG.DEBUG.ENABLE_MOCK_DATA) {
            return await this.getMockData(endpoint, method, data);
        }
        
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(this.timeout)
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(data);
        }
        
        Utils.log.debug('API 요청:', method, endpoint, data);
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        Utils.log.debug('API 응답:', endpoint, result);
        
        return result;
    }
    
    /**
     * 목업 데이터 반환 (개발용)
     */
    async getMockData(endpoint, method, data) {
        // 인위적 지연 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        
        Utils.log.debug('목업 데이터 요청:', method, endpoint, data);
        
        // 엔드포인트별 목업 데이터
        switch (endpoint) {
            case CONFIG.API.ENDPOINTS.GET_POSTS:
                return this.getMockPosts(data);
            
            case CONFIG.API.ENDPOINTS.GET_POST:
                return this.getMockPost(data);
            
            case CONFIG.API.ENDPOINTS.CREATE_POST:
                return this.createMockPost(data);
            
            case CONFIG.API.ENDPOINTS.UPDATE_POST:
                return this.updateMockPost(data);
            
            case CONFIG.API.ENDPOINTS.DELETE_POST:
                return this.deleteMockPost(data);
            
            case CONFIG.API.ENDPOINTS.GET_COMMENTS:
                return this.getMockComments(data);
            
            case CONFIG.API.ENDPOINTS.CREATE_COMMENT:
                return this.createMockComment(data);
            
            case CONFIG.API.ENDPOINTS.GET_ARTWORK:
                return this.getMockArtwork(data);
            
            case CONFIG.API.ENDPOINTS.SEARCH:
                return this.getMockSearchResults(data);
            
            default:
                return {
                    success: true,
                    data: null,
                    message: '목업 데이터 없음'
                };
        }
    }
    
    /**
     * 목업 포스트 목록
     */
    getMockPosts(params = {}) {
        const { page = 1, limit = CONFIG.BLOG.POSTS_PER_PAGE, category = '', tag = '' } = params;
        
        let posts = [
            {
                id: '1',
                title: 'OA Design Studio 블로그 시작',
                content: '<p>안녕하세요! OA Design Studio의 새로운 블로그에 오신 것을 환영합니다. 이곳에서는 디자인과 관련된 다양한 이야기를 나누어 보겠습니다.</p><p>앞으로 웹디자인, UI/UX, 브랜딩 등 다양한 주제로 유용한 콘텐츠를 제공할 예정입니다.</p>',
                excerpt: '안녕하세요! OA Design Studio의 새로운 블로그에 오신 것을 환영합니다. 이곳에서는 디자인과 관련된 다양한 이야기를 나누어 보겠습니다.',
                author: '관리자',
                category: '공지사항',
                tags: ['블로그', '시작', '환영'],
                featured: true,
                published: true,
                createdAt: '2024-01-15T10:00:00Z',
                updatedAt: '2024-01-15T10:00:00Z',
                thumbnail: '/assets/images/blog-start.jpg',
                viewCount: 156,
                commentCount: 5
            },
            {
                id: '2',
                title: '2024년 웹디자인 트렌드',
                content: '<h2>올해 주목할 웹디자인 트렌드</h2><p>2024년 웹디자인 업계에서 주목받고 있는 트렌드들을 살펴보겠습니다.</p><h3>1. 미니멀리즘의 진화</h3><p>단순함 속에서 개성을 찾는 새로운 미니멀리즘이 주목받고 있습니다.</p>',
                excerpt: '2024년 웹디자인 업계에서 주목받고 있는 트렌드들을 살펴보겠습니다. 미니멀리즘의 진화부터 대담한 타이포그래피까지...',
                author: '관리자',
                category: '웹디자인',
                tags: ['웹디자인', '트렌드', '2024'],
                featured: true,
                published: true,
                createdAt: '2024-01-20T14:30:00Z',
                updatedAt: '2024-01-20T14:30:00Z',
                thumbnail: '/assets/images/web-trends-2024.jpg',
                viewCount: 284,
                commentCount: 12
            },
            {
                id: '3',
                title: 'UI/UX 디자인 기초 가이드',
                content: '<h2>사용자 경험을 위한 디자인</h2><p>좋은 UI/UX 디자인의 핵심 원칙들을 알아보겠습니다.</p><p>사용자 중심의 디자인 사고와 실무에서 적용할 수 있는 팁들을 제공합니다.</p>',
                excerpt: '좋은 UI/UX 디자인의 핵심 원칙들을 알아보겠습니다. 사용자 중심의 디자인 사고와 실무에서 적용할 수 있는 팁들을 제공합니다.',
                author: '관리자',
                category: 'UI/UX',
                tags: ['UI', 'UX', '디자인', '가이드'],
                featured: false,
                published: true,
                createdAt: '2024-01-25T09:15:00Z',
                updatedAt: '2024-01-25T09:15:00Z',
                thumbnail: '/assets/images/uiux-guide.jpg',
                viewCount: 198,
                commentCount: 8
            },
            {
                id: '4',
                title: '브랜드 아이덴티티 구축하기',
                content: '<h2>강력한 브랜드 만들기</h2><p>성공적인 브랜드 아이덴티티 구축을 위한 전략과 방법론을 소개합니다.</p>',
                excerpt: '성공적인 브랜드 아이덴티티 구축을 위한 전략과 방법론을 소개합니다.',
                author: '관리자',
                category: '브랜딩',
                tags: ['브랜딩', '아이덴티티', '로고'],
                featured: false,
                published: true,
                createdAt: '2024-01-30T16:45:00Z',
                updatedAt: '2024-01-30T16:45:00Z',
                thumbnail: '/assets/images/brand-identity.jpg',
                viewCount: 142,
                commentCount: 3
            }
        ];
        
        // 필터링
        if (category) {
            posts = posts.filter(post => post.category === category);
        }
        if (tag) {
            posts = posts.filter(post => post.tags.includes(tag));
        }
        
        // 페이지네이션
        const total = posts.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedPosts = posts.slice(startIndex, endIndex);
        
        return {
            success: true,
            data: {
                posts: paginatedPosts,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: endIndex < total,
                    hasPrev: page > 1
                }
            }
        };
    }
    
    /**
     * 목업 단일 포스트
     */
    getMockPost(params) {
        const { id } = params;
        const posts = this.getMockPosts().data.posts;
        const post = posts.find(p => p.id === id);
        
        if (post) {
            return {
                success: true,
                data: post
            };
        } else {
            return {
                success: false,
                message: '포스트를 찾을 수 없습니다.'
            };
        }
    }
    
    /**
     * 목업 포스트 생성
     */
    createMockPost(data) {
        const newPost = {
            id: Date.now().toString(),
            ...data,
            author: Auth.getUser()?.name || '익명',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            viewCount: 0,
            commentCount: 0
        };
        
        return {
            success: true,
            data: newPost,
            message: '포스트가 생성되었습니다.'
        };
    }
    
    /**
     * 목업 포스트 업데이트
     */
    updateMockPost(data) {
        return {
            success: true,
            data: {
                ...data,
                updatedAt: new Date().toISOString()
            },
            message: '포스트가 업데이트되었습니다.'
        };
    }
    
    /**
     * 목업 포스트 삭제
     */
    deleteMockPost(data) {
        return {
            success: true,
            message: '포스트가 삭제되었습니다.'
        };
    }
    
    /**
     * 목업 댓글 목록
     */
    getMockComments(params) {
        const { postId } = params;
        
        const comments = [
            {
                id: '1',
                postId,
                author: '독자1',
                email: 'reader1@example.com',
                content: '정말 유용한 정보네요! 감사합니다.',
                createdAt: '2024-01-16T12:30:00Z',
                approved: true
            },
            {
                id: '2',
                postId,
                author: '독자2',
                email: 'reader2@example.com',
                content: '더 자세한 내용이 궁금합니다.',
                createdAt: '2024-01-17T08:15:00Z',
                approved: true
            }
        ];
        
        return {
            success: true,
            data: comments
        };
    }
    
    /**
     * 목업 댓글 생성
     */
    createMockComment(data) {
        const newComment = {
            id: Date.now().toString(),
            ...data,
            createdAt: new Date().toISOString(),
            approved: false // 관리자 승인 필요
        };
        
        return {
            success: true,
            data: newComment,
            message: '댓글이 등록되었습니다. 승인 후 표시됩니다.'
        };
    }
    
    /**
     * 목업 아트워크 목록
     */
    getMockArtwork(params = {}) {
        const { page = 1, limit = CONFIG.ARTWORK.ITEMS_PER_PAGE, category = '' } = params;
        
        let artwork = [
            {
                id: '1',
                title: '모던 웹사이트 디자인',
                description: '깔끔하고 현대적인 웹사이트 디자인 프로젝트',
                category: '웹디자인',
                image: '/assets/images/artwork/web-design-1.jpg',
                thumbnail: '/assets/images/artwork/thumbs/web-design-1.jpg',
                tags: ['웹디자인', '모던', 'UI'],
                createdAt: '2024-01-10T00:00:00Z'
            },
            {
                id: '2',
                title: '브랜드 로고 디자인',
                description: '스타트업을 위한 심볼릭한 로고 디자인',
                category: '브랜딩',
                image: '/assets/images/artwork/logo-design-1.jpg',
                thumbnail: '/assets/images/artwork/thumbs/logo-design-1.jpg',
                tags: ['로고', '브랜딩', '심볼'],
                createdAt: '2024-01-12T00:00:00Z'
            }
        ];
        
        // 필터링
        if (category && category !== '전체') {
            artwork = artwork.filter(item => item.category === category);
        }
        
        // 페이지네이션
        const total = artwork.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedArtwork = artwork.slice(startIndex, endIndex);
        
        return {
            success: true,
            data: {
                artwork: paginatedArtwork,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: endIndex < total,
                    hasPrev: page > 1
                }
            }
        };
    }
    
    /**
     * 목업 검색 결과
     */
    getMockSearchResults(params) {
        const { query, type = 'all' } = params;
        
        // 간단한 검색 시뮬레이션
        const allPosts = this.getMockPosts().data.posts;
        const results = allPosts.filter(post => 
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            post.content.toLowerCase().includes(query.toLowerCase()) ||
            post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        return {
            success: true,
            data: {
                query,
                results,
                total: results.length
            }
        };
    }
    
    /**
     * 캐시 정리
     */
    clearCache(pattern = null) {
        if (pattern) {
            // 패턴에 맞는 캐시만 삭제
            for (const [key] of this.cache) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            // 전체 캐시 삭제
            this.cache.clear();
        }
        
        Utils.log.info('캐시 정리됨:', pattern || '전체');
    }
    
    /**
     * 캐시 상태 확인
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            memoryUsage: JSON.stringify([...this.cache]).length,
            keys: [...this.cache.keys()]
        };
    }
}

// 전역 API 인스턴스
window.SheetsAPI = new SheetsAPI();
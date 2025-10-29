/**
 * 인증 및 권한 관리 모듈
 * OA Design Studio - 오에이디자인스튜디오
 */

/**
 * 인증 관리자
 */
class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
        this.permissions = [];
        this.sessionTimeout = null;
        this.init();
    }
    
    /**
     * 초기화
     */
    init() {
        this.loadSession();
        this.setupEventListeners();
        this.startSessionCheck();
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 페이지 가시성 변경 감지
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkSession();
            }
        });
        
        // 스토리지 변경 감지 (다른 탭에서 로그아웃 등)
        window.addEventListener('storage', (e) => {
            if (e.key === 'oad_auth_session' && !e.newValue) {
                this.logout(false); // 자동 로그아웃, API 호출 없이
            }
        });
    }
    
    /**
     * 세션 로드
     */
    loadSession() {
        try {
            const session = Utils.storage.get('oad_auth_session');
            if (session) {
                this.isAuthenticated = true;
                this.user = session.user;
                this.permissions = session.permissions || [];
                
                // 관리자 UI 표시
                this.updateUI();
                
                Utils.log.info('세션 로드됨:', this.user);
            }
        } catch (error) {
            Utils.log.error('세션 로드 오류:', error);
            this.logout(false);
        }
    }
    
    /**
     * 로그인
     */
    async login(credentials) {
        try {
            Utils.log.info('로그인 시도:', credentials.email);
            
            // 개발 모드에서는 목업 데이터 사용
            if (CONFIG.DEBUG.ENABLE_MOCK_DATA) {
                return this.mockLogin(credentials);
            }
            
            // Google Apps Script API 호출
            const response = await fetch(`${CONFIG.APPS_SCRIPT.WEB_APP_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });
            
            if (!response.ok) {
                throw new Error(`로그인 실패: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.isAuthenticated = true;
                this.user = result.user;
                this.permissions = result.permissions || [];
                
                // 세션 저장 (24시간)
                Utils.storage.set('oad_auth_session', {
                    user: this.user,
                    permissions: this.permissions,
                    loginTime: Date.now()
                }, 24 * 60 * 60 * 1000);
                
                this.updateUI();
                this.startSessionTimeout();
                
                Utils.log.info('로그인 성공:', this.user);
                
                // 로그인 이벤트 발생
                this.dispatchEvent('login', { user: this.user });
                
                return { success: true, user: this.user };
            } else {
                throw new Error(result.message || '로그인에 실패했습니다.');
            }
            
        } catch (error) {
            Utils.log.error('로그인 오류:', error);
            return { success: false, message: error.message };
        }
    }
    
    /**
     * 목업 로그인 (개발용)
     */
    mockLogin(credentials) {
        // 테스트 계정
        const testAccount = {
            email: 'admin@oadstudio.com',
            password: 'admin123'
        };
        
        if (credentials.email === testAccount.email && 
            credentials.password === testAccount.password) {
            
            this.isAuthenticated = true;
            this.user = {
                id: 'mock_admin',
                email: testAccount.email,
                name: '관리자',
                role: 'admin',
                avatar: '/assets/images/default-avatar.jpg'
            };
            this.permissions = ['read', 'write', 'delete', 'admin'];
            
            // 세션 저장
            Utils.storage.set('oad_auth_session', {
                user: this.user,
                permissions: this.permissions,
                loginTime: Date.now()
            }, 24 * 60 * 60 * 1000);
            
            this.updateUI();
            this.dispatchEvent('login', { user: this.user });
            
            Utils.log.info('목업 로그인 성공:', this.user);
            
            return { success: true, user: this.user };
        } else {
            return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
        }
    }
    
    /**
     * 로그아웃
     */
    async logout(callApi = true) {
        try {
            if (callApi && !CONFIG.DEBUG.ENABLE_MOCK_DATA) {
                // Google Apps Script API 호출
                await fetch(`${CONFIG.APPS_SCRIPT.WEB_APP_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
            }
            
            // 세션 정리
            this.isAuthenticated = false;
            this.user = null;
            this.permissions = [];
            
            // 스토리지 정리
            Utils.storage.remove('oad_auth_session');
            
            // 세션 타임아웃 정리
            if (this.sessionTimeout) {
                clearTimeout(this.sessionTimeout);
                this.sessionTimeout = null;
            }
            
            // UI 업데이트
            this.updateUI();
            
            // 로그아웃 이벤트 발생
            this.dispatchEvent('logout');
            
            Utils.log.info('로그아웃 완료');
            
            return { success: true };
            
        } catch (error) {
            Utils.log.error('로그아웃 오류:', error);
            return { success: false, message: error.message };
        }
    }
    
    /**
     * 세션 확인
     */
    async checkSession() {
        if (!this.isAuthenticated) return false;
        
        try {
            if (CONFIG.DEBUG.ENABLE_MOCK_DATA) {
                return true; // 목업 모드에서는 항상 유효
            }
            
            const response = await fetch(`${CONFIG.APPS_SCRIPT.WEB_APP_URL}/auth/check`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.valid;
            } else {
                throw new Error('세션 확인 실패');
            }
            
        } catch (error) {
            Utils.log.error('세션 확인 오류:', error);
            this.logout(false);
            return false;
        }
    }
    
    /**
     * 세션 체크 시작
     */
    startSessionCheck() {
        // 5분마다 세션 확인
        setInterval(() => {
            if (this.isAuthenticated) {
                this.checkSession();
            }
        }, 5 * 60 * 1000);
    }
    
    /**
     * 세션 타임아웃 시작
     */
    startSessionTimeout() {
        // 30분 후 자동 로그아웃
        this.sessionTimeout = setTimeout(() => {
            this.logout();
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        }, 30 * 60 * 1000);
    }
    
    /**
     * 권한 확인
     */
    hasPermission(permission) {
        return this.isAuthenticated && this.permissions.includes(permission);
    }
    
    /**
     * 관리자 권한 확인
     */
    isAdmin() {
        return this.hasPermission('admin');
    }
    
    /**
     * 쓰기 권한 확인
     */
    canWrite() {
        return this.hasPermission('write') || this.hasPermission('admin');
    }
    
    /**
     * 삭제 권한 확인
     */
    canDelete() {
        return this.hasPermission('delete') || this.hasPermission('admin');
    }
    
    /**
     * UI 업데이트
     */
    updateUI() {
        // 관리자 버튼 표시/숨김
        const adminButtons = $$('.admin-only');
        adminButtons.forEach(button => {
            button.style.display = this.isAuthenticated ? 'block' : 'none';
        });
        
        // 로그인/로그아웃 버튼 표시/숨김
        const loginBtn = $('#login-btn');
        const logoutBtn = $('#logout-btn');
        const userInfo = $('#user-info');
        
        if (loginBtn) loginBtn.style.display = this.isAuthenticated ? 'none' : 'block';
        if (logoutBtn) logoutBtn.style.display = this.isAuthenticated ? 'block' : 'none';
        
        if (userInfo && this.isAuthenticated) {
            userInfo.innerHTML = `
                <div class="user-profile">
                    <img src="${this.user.avatar || '/assets/images/default-avatar.jpg'}" 
                         alt="${this.user.name}" class="user-avatar">
                    <span class="user-name">${this.user.name}</span>
                </div>
            `;
            userInfo.style.display = 'block';
        } else if (userInfo) {
            userInfo.style.display = 'none';
        }
        
        // 페이지별 권한 확인
        this.checkPagePermissions();
    }
    
    /**
     * 페이지별 권한 확인
     */
    checkPagePermissions() {
        const currentPage = Utils.url.getCurrentPage();
        
        // 에디터 페이지는 쓰기 권한 필요
        if (currentPage === 'editor' && !this.canWrite()) {
            if (confirm('글 작성 권한이 필요합니다. 로그인하시겠습니까?')) {
                this.showLoginModal();
            } else {
                window.location.href = '/';
            }
        }
    }
    
    /**
     * 로그인 모달 표시
     */
    showLoginModal() {
        const modal = $('#login-modal');
        if (modal) {
            modal.style.display = 'block';
            
            // 모달 닫기 이벤트
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
            
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }
            
            // 로그인 폼 이벤트
            const loginForm = modal.querySelector('#login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', this.handleLoginForm.bind(this));
            }
        } else {
            // 모달이 없으면 프롬프트로 대체
            const email = prompt('이메일을 입력하세요:');
            const password = prompt('비밀번호를 입력하세요:');
            
            if (email && password) {
                this.login({ email, password });
            }
        }
    }
    
    /**
     * 로그인 폼 처리
     */
    async handleLoginForm(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };
        
        const loginBtn = e.target.querySelector('button[type="submit"]');
        const originalText = loginBtn.textContent;
        
        // 로딩 상태
        loginBtn.textContent = '로그인 중...';
        loginBtn.disabled = true;
        
        try {
            const result = await this.login(credentials);
            
            if (result.success) {
                // 모달 닫기
                const modal = $('#login-modal');
                if (modal) modal.style.display = 'none';
                
                // 폼 리셋
                e.target.reset();
                
                alert('로그인되었습니다.');
            } else {
                alert(result.message || '로그인에 실패했습니다.');
            }
        } catch (error) {
            alert('로그인 중 오류가 발생했습니다.');
        } finally {
            // 버튼 상태 복원
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
        }
    }
    
    /**
     * 이벤트 발생
     */
    dispatchEvent(type, data = {}) {
        const event = new CustomEvent(`auth:${type}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 사용자 정보 가져오기
     */
    getUser() {
        return this.user;
    }
    
    /**
     * 인증 상태 확인
     */
    isLoggedIn() {
        return this.isAuthenticated;
    }
}

// 전역 인증 관리자 인스턴스
window.Auth = new AuthManager();

// 페이지 로드 시 UI 업데이트
document.addEventListener('DOMContentLoaded', () => {
    // 로그인 버튼 이벤트
    const loginBtn = $('#login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            Auth.showLoginModal();
        });
    }
    
    // 로그아웃 버튼 이벤트
    const logoutBtn = $('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('로그아웃하시겠습니까?')) {
                await Auth.logout();
                alert('로그아웃되었습니다.');
            }
        });
    }
    
    // 관리자 버튼 이벤트
    const adminBtns = $$('.admin-btn');
    adminBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!Auth.isLoggedIn()) {
                Auth.showLoginModal();
            }
        });
    });
});
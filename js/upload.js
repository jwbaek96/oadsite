/**
 * 파일 업로드 유틸리티
 * OA Design Studio - 오에이디자인스튜디오
 */

/**
 * 파일 업로드 관리자
 */
class UploadManager {
    constructor() {
        this.uploadQueue = [];
        this.isUploading = false;
        this.uploadProgress = {};
        
        this.init();
    }
    
    /**
     * 초기화
     */
    init() {
        this.setupDragDropZones();
        this.setupFileInputs();
        this.setupProgressTracking();
        
        Utils.log.info('업로드 매니저 초기화 완료');
    }
    
    /**
     * 드래그 앤 드롭 영역 설정
     */
    setupDragDropZones() {
        const dropZones = $$('.upload-drop-zone');
        
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });
            
            zone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                if (!zone.contains(e.relatedTarget)) {
                    zone.classList.remove('drag-over');
                }
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                const files = Array.from(e.dataTransfer.files);
                const uploadType = zone.dataset.uploadType || 'image';
                
                this.handleFiles(files, uploadType);
            });
        });
    }
    
    /**
     * 파일 입력 설정
     */
    setupFileInputs() {
        const fileInputs = $$('input[type="file"]');
        
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                const uploadType = input.dataset.uploadType || 'image';
                
                this.handleFiles(files, uploadType);
                
                // 입력 초기화
                input.value = '';
            });
        });
    }
    
    /**
     * 진행률 추적 설정
     */
    setupProgressTracking() {
        // 전역 진행률 표시기 생성
        if (!$('#upload-progress-container')) {
            const progressContainer = Utils.dom.create('div', {
                id: 'upload-progress-container',
                className: 'upload-progress-container'
            });
            
            document.body.appendChild(progressContainer);
        }
    }
    
    /**
     * 파일 처리
     */
    async handleFiles(files, uploadType = 'image') {
        const validFiles = [];
        
        for (const file of files) {
            const validation = this.validateFile(file, uploadType);
            
            if (validation.valid) {
                validFiles.push(file);
            } else {
                this.showError(`${file.name}: ${validation.message}`);
            }
        }
        
        if (validFiles.length > 0) {
            await this.uploadFiles(validFiles, uploadType);
        }
    }
    
    /**
     * 파일 유효성 검사
     */
    validateFile(file, uploadType) {
        const validation = { valid: true, message: '' };
        
        switch (uploadType) {
            case 'image':
                if (!Utils.file.isImage(file)) {
                    validation.valid = false;
                    validation.message = '이미지 파일만 업로드할 수 있습니다.';
                } else if (file.size > CONFIG.MEDIA.MAX_IMAGE_SIZE) {
                    validation.valid = false;
                    validation.message = `이미지 크기는 ${Utils.file.formatSize(CONFIG.MEDIA.MAX_IMAGE_SIZE)} 이하여야 합니다.`;
                }
                break;
                
            case 'video':
                if (!Utils.file.isVideo(file)) {
                    validation.valid = false;
                    validation.message = '비디오 파일만 업로드할 수 있습니다.';
                } else if (file.size > CONFIG.MEDIA.MAX_VIDEO_SIZE) {
                    validation.valid = false;
                    validation.message = `비디오 크기는 ${Utils.file.formatSize(CONFIG.MEDIA.MAX_VIDEO_SIZE)} 이하여야 합니다.`;
                }
                break;
                
            case 'document':
                const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                if (!allowedTypes.includes(file.type)) {
                    validation.valid = false;
                    validation.message = 'PDF, Word 문서만 업로드할 수 있습니다.';
                }
                break;
        }
        
        return validation;
    }
    
    /**
     * 파일 업로드
     */
    async uploadFiles(files, uploadType) {
        this.isUploading = true;
        
        for (const file of files) {
            const uploadId = this.generateUploadId();
            this.uploadQueue.push({ id: uploadId, file, uploadType });
            
            this.showProgress(uploadId, file.name, 0);
            
            try {
                const result = await this.uploadSingleFile(file, uploadType, uploadId);
                
                if (result.success) {
                    this.showProgress(uploadId, file.name, 100);
                    this.onUploadSuccess(result, uploadType);
                    
                    // 성공 후 진행률 제거
                    setTimeout(() => {
                        this.hideProgress(uploadId);
                    }, 2000);
                } else {
                    this.showError(`${file.name} 업로드 실패: ${result.message}`);
                    this.hideProgress(uploadId);
                }
                
            } catch (error) {
                Utils.log.error('파일 업로드 오류:', error);
                this.showError(`${file.name} 업로드 중 오류가 발생했습니다.`);
                this.hideProgress(uploadId);
            }
        }
        
        this.isUploading = false;
    }
    
    /**
     * 단일 파일 업로드
     */
    async uploadSingleFile(file, uploadType, uploadId) {
        // 이미지 리사이즈 (이미지인 경우)
        let processedFile = file;
        if (uploadType === 'image') {
            processedFile = await this.processImage(file, uploadId);
        }
        
        // Base64 변환
        const base64Data = await Utils.file.toBase64(processedFile);
        
        // 업로드 진행률 업데이트
        this.updateProgress(uploadId, 50);
        
        // API 엔드포인트 결정
        const endpoint = uploadType === 'image' 
            ? CONFIG.API.ENDPOINTS.UPLOAD_IMAGE 
            : CONFIG.API.ENDPOINTS.UPLOAD_VIDEO;
        
        // 서버로 업로드
        const response = await SheetsAPI.request(endpoint, {
            method: 'POST',
            data: {
                file: base64Data,
                filename: file.name,
                size: processedFile.size,
                originalSize: file.size,
                uploadType: uploadType
            }
        });
        
        this.updateProgress(uploadId, 90);
        
        return response;
    }
    
    /**
     * 이미지 처리 (리사이즈, 최적화)
     */
    async processImage(file, uploadId) {
        try {
            // 리사이즈 옵션
            const maxWidth = 1920;
            const maxHeight = 1080;
            const quality = 0.85;
            
            this.updateProgress(uploadId, 25);
            
            // 이미지 리사이즈
            const resizedFile = await Utils.file.resizeImage(file, maxWidth, maxHeight, quality);
            
            return resizedFile;
            
        } catch (error) {
            Utils.log.warn('이미지 처리 실패, 원본 사용:', error);
            return file;
        }
    }
    
    /**
     * 업로드 성공 처리
     */
    onUploadSuccess(result, uploadType) {
        const event = new CustomEvent('uploadSuccess', {
            detail: {
                result,
                uploadType
            }
        });
        
        document.dispatchEvent(event);
        
        // 에디터에 삽입 (에디터 페이지인 경우)
        if (window.editorPage && uploadType === 'image') {
            window.editorPage.insertImageToEditor(result.data.url, result.data.filename);
        }
    }
    
    /**
     * 진행률 표시
     */
    showProgress(uploadId, filename, progress) {
        const container = $('#upload-progress-container');
        if (!container) return;
        
        let progressItem = $(`#upload-${uploadId}`);
        
        if (!progressItem) {
            progressItem = Utils.dom.create('div', {
                id: `upload-${uploadId}`,
                className: 'upload-progress-item',
                innerHTML: `
                    <div class="upload-info">
                        <span class="upload-filename">${filename}</span>
                        <span class="upload-size">${Utils.file.formatSize(0)}</span>
                    </div>
                    <div class="upload-progress-bar">
                        <div class="upload-progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="upload-status">업로드 중...</div>
                `
            });
            
            container.appendChild(progressItem);
        }
        
        this.updateProgress(uploadId, progress);
        
        // 컨테이너 표시
        container.style.display = 'block';
    }
    
    /**
     * 진행률 업데이트
     */
    updateProgress(uploadId, progress) {
        const progressItem = $(`#upload-${uploadId}`);
        if (!progressItem) return;
        
        const progressFill = progressItem.querySelector('.upload-progress-fill');
        const statusElement = progressItem.querySelector('.upload-status');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        if (statusElement) {
            if (progress >= 100) {
                statusElement.textContent = '업로드 완료';
                progressItem.classList.add('completed');
            } else {
                statusElement.textContent = `업로드 중... ${Math.round(progress)}%`;
            }
        }
        
        this.uploadProgress[uploadId] = progress;
    }
    
    /**
     * 진행률 숨김
     */
    hideProgress(uploadId) {
        const progressItem = $(`#upload-${uploadId}`);
        if (progressItem) {
            progressItem.remove();
        }
        
        delete this.uploadProgress[uploadId];
        
        // 모든 업로드가 완료되면 컨테이너 숨김
        const container = $('#upload-progress-container');
        if (container && container.children.length === 0) {
            container.style.display = 'none';
        }
    }
    
    /**
     * 업로드 ID 생성
     */
    generateUploadId() {
        return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 에러 메시지 표시
     */
    showError(message) {
        const notification = Utils.dom.create('div', {
            className: 'notification notification-error upload-error',
            innerHTML: `
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            `
        });
        
        document.body.appendChild(notification);
        
        // 닫기 버튼 이벤트
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // 자동 제거
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
     * 업로드 취소
     */
    cancelUpload(uploadId) {
        // 큐에서 제거
        this.uploadQueue = this.uploadQueue.filter(item => item.id !== uploadId);
        
        // 진행률 숨김
        this.hideProgress(uploadId);
    }
    
    /**
     * 모든 업로드 취소
     */
    cancelAllUploads() {
        this.uploadQueue = [];
        
        // 모든 진행률 제거
        Object.keys(this.uploadProgress).forEach(uploadId => {
            this.hideProgress(uploadId);
        });
        
        this.isUploading = false;
    }
    
    /**
     * 업로드 상태 확인
     */
    isUploadInProgress() {
        return this.isUploading || this.uploadQueue.length > 0;
    }
    
    /**
     * 업로드 통계
     */
    getUploadStats() {
        return {
            queueLength: this.uploadQueue.length,
            activeUploads: Object.keys(this.uploadProgress).length,
            isUploading: this.isUploading
        };
    }
}

/**
 * 이미지 에디터 (간단한 크롭/리사이즈)
 */
class SimpleImageEditor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.cropArea = { x: 0, y: 0, width: 0, height: 0 };
    }
    
    /**
     * 이미지 로드
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    this.image = img;
                    this.setupCanvas();
                    resolve(img);
                };
                
                img.onerror = reject;
                img.src = e.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * 캔버스 설정
     */
    setupCanvas() {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
        }
        
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;
        
        this.ctx.drawImage(this.image, 0, 0);
    }
    
    /**
     * 이미지 리사이즈
     */
    resize(maxWidth, maxHeight, quality = 0.8) {
        if (!this.image) return null;
        
        let { width, height } = this.image;
        
        // 비율 유지하면서 리사이즈
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
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.ctx.drawImage(this.image, 0, 0, width, height);
        
        return new Promise(resolve => {
            this.canvas.toBlob(resolve, 'image/jpeg', quality);
        });
    }
    
    /**
     * 이미지 크롭
     */
    crop(x, y, width, height, quality = 0.8) {
        if (!this.image) return null;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.ctx.drawImage(
            this.image,
            x, y, width, height,
            0, 0, width, height
        );
        
        return new Promise(resolve => {
            this.canvas.toBlob(resolve, 'image/jpeg', quality);
        });
    }
    
    /**
     * 필터 적용
     */
    applyFilter(filterType, intensity = 1) {
        if (!this.image) return;
        
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        switch (filterType) {
            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = data[i + 1] = data[i + 2] = gray * intensity + data[i] * (1 - intensity);
                }
                break;
                
            case 'sepia':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                }
                break;
                
            case 'brightness':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] + (255 * intensity * 0.1));
                    data[i + 1] = Math.min(255, data[i + 1] + (255 * intensity * 0.1));
                    data[i + 2] = Math.min(255, data[i + 2] + (255 * intensity * 0.1));
                }
                break;
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * 결과 이미지 가져오기
     */
    getResult(quality = 0.8) {
        return new Promise(resolve => {
            this.canvas.toBlob(resolve, 'image/jpeg', quality);
        });
    }
}

// 전역 업로드 매니저 인스턴스
window.UploadManager = new UploadManager();
window.ImageEditor = new SimpleImageEditor();

// 페이지 떠나기 전 업로드 확인
window.addEventListener('beforeunload', (e) => {
    if (UploadManager.isUploadInProgress()) {
        e.preventDefault();
        e.returnValue = '파일 업로드가 진행 중입니다. 정말 나가시겠습니까?';
    }
});
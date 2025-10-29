/**
 * 에디터 페이지 JavaScript
 * OA Design Studio - 오에이디자인스튜디오
 */

class EditorPage {
    constructor() {
        this.editor = null;
        this.currentPost = null;
        this.postId = null;
        this.isEditMode = false;
        this.isDirty = false;
        this.autoSaveTimer = null;
        this.currentImageUpload = null;
        
        this.init();
    }
    
    /**
     * 초기화
     */
    async init() {
        try {
            // 권한 확인
            if (!Auth.canWrite()) {
                Auth.showLoginModal();
                return;
            }
            
            this.postId = Utils.url.getParam('id');
            this.isEditMode = !!this.postId;
            
            this.setupEditor();
            this.setupEventListeners();
            this.setupAutoSave();
            
            if (this.isEditMode) {
                await this.loadPost();
            }
            
            Utils.log.info('에디터 페이지 초기화 완료');
        } catch (error) {
            Utils.log.error('에디터 페이지 초기화 오류:', error);
            this.showError(error.message);
        }
    }
    
    /**
     * 에디터 설정
     */
    setupEditor() {
        const editorContainer = $('#editor-content');
        if (!editorContainer) return;
        
        // contenteditable 에디터 초기화
        editorContainer.contentEditable = true;
        editorContainer.setAttribute('data-placeholder', '포스트 내용을 입력하세요...');
        
        // 에디터 이벤트
        editorContainer.addEventListener('input', () => {
            this.handleEditorChange();
        });
        
        editorContainer.addEventListener('paste', (e) => {
            this.handlePaste(e);
        });
        
        editorContainer.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });
        
        // 드래그 앤 드롭
        editorContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            editorContainer.classList.add('drag-over');
        });
        
        editorContainer.addEventListener('dragleave', () => {
            editorContainer.classList.remove('drag-over');
        });
        
        editorContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            editorContainer.classList.remove('drag-over');
            this.handleFileDrop(e);
        });
        
        this.editor = editorContainer;
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 툴바 버튼들
        const toolbarButtons = $$('.toolbar-btn');
        toolbarButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.dataset.command;
                const value = btn.dataset.value || null;
                this.executeCommand(command, value);
            });
        });
        
        // 저장 버튼
        const saveBtn = $('#save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.savePost();
            });
        }
        
        // 미리보기 버튼
        const previewBtn = $('#preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.togglePreview();
            });
        }
        
        // 발행 버튼
        const publishBtn = $('#publish-btn');
        if (publishBtn) {
            publishBtn.addEventListener('click', () => {
                this.publishPost();
            });
        }
        
        // 임시저장 버튼
        const draftBtn = $('#draft-btn');
        if (draftBtn) {
            draftBtn.addEventListener('click', () => {
                this.saveDraft();
            });
        }
        
        // 파일 업로드
        const imageUpload = $('#image-upload');
        if (imageUpload) {
            imageUpload.addEventListener('change', (e) => {
                this.handleImageUpload(e.target.files);
            });
        }
        
        const videoUpload = $('#video-upload');
        if (videoUpload) {
            videoUpload.addEventListener('change', (e) => {
                this.handleVideoUpload(e.target.files);
            });
        }
        
        // 이미지 삽입 버튼
        const insertImageBtn = $('#insert-image-btn');
        if (insertImageBtn) {
            insertImageBtn.addEventListener('click', () => {
                imageUpload.click();
            });
        }
        
        // 썸네일 업로드
        const thumbnailUpload = $('#thumbnail-upload');
        if (thumbnailUpload) {
            thumbnailUpload.addEventListener('change', (e) => {
                this.handleThumbnailUpload(e.target.files[0]);
            });
        }
        
        // 폼 입력 이벤트
        const titleInput = $('#post-title');
        const excerptInput = $('#post-excerpt');
        const categorySelect = $('#post-category');
        const tagsInput = $('#post-tags');
        
        [titleInput, excerptInput, categorySelect, tagsInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    this.handleFormChange();
                });
            }
        });
        
        // 페이지 나가기 전 경고
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                e.returnValue = '저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?';
            }
        });
        
        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.savePost();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.togglePreview();
                        break;
                    case 'b':
                        e.preventDefault();
                        this.executeCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.executeCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.executeCommand('underline');
                        break;
                }
            }
        });
    }
    
    /**
     * 자동 저장 설정
     */
    setupAutoSave() {
        if (CONFIG.EDITOR.AUTO_SAVE) {
            this.autoSaveTimer = setInterval(() => {
                if (this.isDirty) {
                    this.saveDraft();
                }
            }, CONFIG.BLOG.AUTO_SAVE_INTERVAL);
        }
    }
    
    /**
     * 포스트 로드 (편집 모드)
     */
    async loadPost() {
        try {
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.GET_POST, {
                method: 'GET',
                data: { id: this.postId }
            });
            
            if (response.success) {
                this.currentPost = response.data;
                this.populateForm();
                this.updatePageTitle();
            } else {
                throw new Error(response.message || '포스트를 불러올 수 없습니다.');
            }
            
        } catch (error) {
            Utils.log.error('포스트 로드 실패:', error);
            this.showError(error.message);
        }
    }
    
    /**
     * 폼에 데이터 채우기
     */
    populateForm() {
        if (!this.currentPost) return;
        
        const titleInput = $('#post-title');
        const excerptInput = $('#post-excerpt');
        const categorySelect = $('#post-category');
        const tagsInput = $('#post-tags');
        const featuredCheck = $('#post-featured');
        const publishedCheck = $('#post-published');
        const thumbnailPreview = $('#thumbnail-preview');
        
        if (titleInput) titleInput.value = this.currentPost.title || '';
        if (excerptInput) excerptInput.value = this.currentPost.excerpt || '';
        if (categorySelect) categorySelect.value = this.currentPost.category || '';
        if (tagsInput) tagsInput.value = this.currentPost.tags ? this.currentPost.tags.join(', ') : '';
        if (featuredCheck) featuredCheck.checked = this.currentPost.featured || false;
        if (publishedCheck) publishedCheck.checked = this.currentPost.published || false;
        
        if (this.editor) {
            this.editor.innerHTML = this.currentPost.content || '';
        }
        
        if (thumbnailPreview && this.currentPost.thumbnail) {
            thumbnailPreview.innerHTML = `
                <img src="${this.currentPost.thumbnail}" alt="썸네일 미리보기">
                <button class="remove-thumbnail-btn" onclick="editorPage.removeThumbnail()">
                    <i class="icon-trash"></i>
                </button>
            `;
        }
    }
    
    /**
     * 페이지 제목 업데이트
     */
    updatePageTitle() {
        const pageTitle = $('#page-title');
        if (pageTitle) {
            pageTitle.textContent = this.isEditMode ? '포스트 편집' : '새 포스트 작성';
        }
        
        document.title = this.isEditMode 
            ? `포스트 편집 - ${CONFIG.SITE_NAME}`
            : `새 포스트 - ${CONFIG.SITE_NAME}`;
    }
    
    /**
     * 에디터 명령 실행
     */
    executeCommand(command, value = null) {
        this.editor.focus();
        
        switch (command) {
            case 'bold':
            case 'italic':
            case 'underline':
            case 'strikeThrough':
                document.execCommand(command);
                break;
                
            case 'heading1':
                this.formatBlock('h1');
                break;
            case 'heading2':
                this.formatBlock('h2');
                break;
            case 'heading3':
                this.formatBlock('h3');
                break;
            case 'paragraph':
                this.formatBlock('p');
                break;
            case 'blockquote':
                this.formatBlock('blockquote');
                break;
                
            case 'insertUnorderedList':
            case 'insertOrderedList':
                document.execCommand(command);
                break;
                
            case 'createLink':
                this.insertLink();
                break;
            case 'unlink':
                document.execCommand('unlink');
                break;
                
            case 'insertImage':
                $('#image-upload').click();
                break;
                
            case 'insertVideo':
                $('#video-upload').click();
                break;
                
            case 'insertTable':
                this.insertTable();
                break;
                
            case 'insertHorizontalRule':
                document.execCommand('insertHTML', false, '<hr>');
                break;
                
            case 'undo':
            case 'redo':
                document.execCommand(command);
                break;
                
            case 'removeFormat':
                document.execCommand('removeFormat');
                break;
        }
        
        this.handleEditorChange();
        this.updateToolbarState();
    }
    
    /**
     * 블록 포맷 적용
     */
    formatBlock(tag) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const element = document.createElement(tag);
        
        try {
            range.surroundContents(element);
        } catch (e) {
            // 선택된 내용이 복잡한 경우 대체 방법 사용
            element.innerHTML = range.extractContents();
            range.insertNode(element);
        }
        
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(element);
        selection.addRange(newRange);
    }
    
    /**
     * 링크 삽입
     */
    insertLink() {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        const url = prompt('링크 URL을 입력하세요:', 'https://');
        if (!url) return;
        
        if (selectedText) {
            document.execCommand('createLink', false, url);
        } else {
            const linkText = prompt('링크 텍스트를 입력하세요:', url);
            if (linkText) {
                document.execCommand('insertHTML', false, `<a href="${url}">${linkText}</a>`);
            }
        }
    }
    
    /**
     * 테이블 삽입
     */
    insertTable() {
        const rows = prompt('행 수를 입력하세요:', '3');
        const cols = prompt('열 수를 입력하세요:', '3');
        
        if (!rows || !cols) return;
        
        let tableHTML = '<table class="editor-table">';
        
        for (let i = 0; i < parseInt(rows); i++) {
            tableHTML += '<tr>';
            for (let j = 0; j < parseInt(cols); j++) {
                tableHTML += i === 0 ? '<th>헤더</th>' : '<td>내용</td>';
            }
            tableHTML += '</tr>';
        }
        
        tableHTML += '</table>';
        
        document.execCommand('insertHTML', false, tableHTML);
    }
    
    /**
     * 툴바 상태 업데이트
     */
    updateToolbarState() {
        const commands = ['bold', 'italic', 'underline', 'strikeThrough'];
        
        commands.forEach(command => {
            const btn = $(`.toolbar-btn[data-command="${command}"]`);
            if (btn) {
                btn.classList.toggle('active', document.queryCommandState(command));
            }
        });
    }
    
    /**
     * 에디터 변경 처리
     */
    handleEditorChange() {
        this.isDirty = true;
        this.updateWordCount();
        this.updateAutoExcerpt();
        this.showSaveIndicator();
    }
    
    /**
     * 폼 변경 처리
     */
    handleFormChange() {
        this.isDirty = true;
        this.showSaveIndicator();
    }
    
    /**
     * 키 입력 처리
     */
    handleKeydown(e) {
        // Tab 키로 들여쓰기
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
        }
        
        // Enter 키 처리
        if (e.key === 'Enter') {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            
            // 블록 요소 내에서 Enter 처리
            const blockElement = container.nodeType === Node.TEXT_NODE 
                ? container.parentElement 
                : container;
                
            if (blockElement.tagName === 'BLOCKQUOTE') {
                e.preventDefault();
                document.execCommand('insertHTML', false, '<br><br>');
            }
        }
    }
    
    /**
     * 붙여넣기 처리
     */
    handlePaste(e) {
        e.preventDefault();
        
        const clipboardData = e.clipboardData || window.clipboardData;
        const items = clipboardData.items;
        
        // 이미지 붙여넣기 처리
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                this.handleImageUpload([file]);
                return;
            }
        }
        
        // 텍스트 붙여넣기
        const text = clipboardData.getData('text/plain');
        if (text) {
            // HTML 태그 제거하고 텍스트만 삽입
            const cleanText = text.replace(/<[^>]*>/g, '');
            document.execCommand('insertText', false, cleanText);
        }
    }
    
    /**
     * 파일 드롭 처리
     */
    handleFileDrop(e) {
        const files = e.dataTransfer.files;
        
        for (let file of files) {
            if (Utils.file.isImage(file)) {
                this.handleImageUpload([file]);
            } else if (Utils.file.isVideo(file)) {
                this.handleVideoUpload([file]);
            }
        }
    }
    
    /**
     * 이미지 업로드 처리
     */
    async handleImageUpload(files) {
        for (let file of files) {
            if (!Utils.file.isImage(file)) {
                this.showErrorMessage('이미지 파일만 업로드할 수 있습니다.');
                continue;
            }
            
            if (file.size > CONFIG.MEDIA.MAX_IMAGE_SIZE) {
                this.showErrorMessage('이미지 크기가 너무 큽니다. (최대 5MB)');
                continue;
            }
            
            try {
                await this.uploadAndInsertImage(file);
            } catch (error) {
                Utils.log.error('이미지 업로드 실패:', error);
                this.showErrorMessage('이미지 업로드에 실패했습니다.');
            }
        }
    }
    
    /**
     * 이미지 업로드 및 삽입
     */
    async uploadAndInsertImage(file) {
        // 로딩 표시
        const loadingId = this.showImageLoading();
        
        try {
            // 이미지 리사이즈 (선택적)
            const resizedFile = await Utils.file.resizeImage(file);
            
            // 개발 모드에서는 로컬 URL 사용
            if (CONFIG.DEBUG.ENABLE_MOCK_DATA) {
                const imageUrl = URL.createObjectURL(resizedFile);
                this.insertImageToEditor(imageUrl, file.name);
            } else {
                // 실제 업로드
                const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.UPLOAD_IMAGE, {
                    method: 'POST',
                    data: {
                        file: await Utils.file.toBase64(resizedFile),
                        filename: file.name,
                        size: resizedFile.size
                    }
                });
                
                if (response.success) {
                    this.insertImageToEditor(response.data.url, file.name);
                } else {
                    throw new Error(response.message);
                }
            }
            
        } finally {
            this.hideImageLoading(loadingId);
        }
    }
    
    /**
     * 에디터에 이미지 삽입
     */
    insertImageToEditor(url, alt) {
        const imageHTML = `<img src="${url}" alt="${alt}" class="editor-image">`;
        document.execCommand('insertHTML', false, imageHTML);
        this.handleEditorChange();
    }
    
    /**
     * 비디오 업로드 처리
     */
    async handleVideoUpload(files) {
        for (let file of files) {
            if (!Utils.file.isVideo(file)) {
                this.showErrorMessage('비디오 파일만 업로드할 수 있습니다.');
                continue;
            }
            
            if (file.size > CONFIG.MEDIA.MAX_VIDEO_SIZE) {
                this.showErrorMessage('비디오 크기가 너무 큽니다. (최대 50MB)');
                continue;
            }
            
            try {
                await this.uploadAndInsertVideo(file);
            } catch (error) {
                Utils.log.error('비디오 업로드 실패:', error);
                this.showErrorMessage('비디오 업로드에 실패했습니다.');
            }
        }
    }
    
    /**
     * 비디오 업로드 및 삽입
     */
    async uploadAndInsertVideo(file) {
        // 개발 모드에서는 로컬 URL 사용
        if (CONFIG.DEBUG.ENABLE_MOCK_DATA) {
            const videoUrl = URL.createObjectURL(file);
            this.insertVideoToEditor(videoUrl);
        } else {
            // 실제 업로드 구현
            const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.UPLOAD_VIDEO, {
                method: 'POST',
                data: {
                    file: await Utils.file.toBase64(file),
                    filename: file.name,
                    size: file.size
                }
            });
            
            if (response.success) {
                this.insertVideoToEditor(response.data.url);
            } else {
                throw new Error(response.message);
            }
        }
    }
    
    /**
     * 에디터에 비디오 삽입
     */
    insertVideoToEditor(url) {
        const videoHTML = `
            <video class="editor-video" controls>
                <source src="${url}" type="video/mp4">
                브라우저가 비디오를 지원하지 않습니다.
            </video>
        `;
        document.execCommand('insertHTML', false, videoHTML);
        this.handleEditorChange();
    }
    
    /**
     * 썸네일 업로드 처리
     */
    async handleThumbnailUpload(file) {
        if (!file || !Utils.file.isImage(file)) {
            this.showErrorMessage('이미지 파일을 선택해주세요.');
            return;
        }
        
        try {
            const resizedFile = await Utils.file.resizeImage(file, 800, 600);
            
            if (CONFIG.DEBUG.ENABLE_MOCK_DATA) {
                const thumbnailUrl = URL.createObjectURL(resizedFile);
                this.updateThumbnailPreview(thumbnailUrl);
            } else {
                const response = await SheetsAPI.request(CONFIG.API.ENDPOINTS.UPLOAD_IMAGE, {
                    method: 'POST',
                    data: {
                        file: await Utils.file.toBase64(resizedFile),
                        filename: `thumbnail_${file.name}`,
                        size: resizedFile.size
                    }
                });
                
                if (response.success) {
                    this.updateThumbnailPreview(response.data.url);
                } else {
                    throw new Error(response.message);
                }
            }
            
        } catch (error) {
            Utils.log.error('썸네일 업로드 실패:', error);
            this.showErrorMessage('썸네일 업로드에 실패했습니다.');
        }
    }
    
    /**
     * 썸네일 미리보기 업데이트
     */
    updateThumbnailPreview(url) {
        const preview = $('#thumbnail-preview');
        if (preview) {
            preview.innerHTML = `
                <img src="${url}" alt="썸네일 미리보기">
                <button class="remove-thumbnail-btn" onclick="editorPage.removeThumbnail()">
                    <i class="icon-trash"></i>
                </button>
            `;
        }
        
        this.handleFormChange();
    }
    
    /**
     * 썸네일 제거
     */
    removeThumbnail() {
        const preview = $('#thumbnail-preview');
        if (preview) {
            preview.innerHTML = '';
        }
        this.handleFormChange();
    }
    
    /**
     * 단어 수 업데이트
     */
    updateWordCount() {
        const wordCountElement = $('#word-count');
        if (!wordCountElement || !this.editor) return;
        
        const text = this.editor.textContent || '';
        const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        const charCount = text.length;
        
        wordCountElement.textContent = `단어: ${wordCount} | 글자: ${charCount}`;
    }
    
    /**
     * 자동 요약 업데이트
     */
    updateAutoExcerpt() {
        const excerptInput = $('#post-excerpt');
        if (!excerptInput || excerptInput.value.trim()) return;
        
        const content = this.editor.textContent || '';
        const excerpt = Utils.string.truncate(content.trim(), CONFIG.BLOG.EXCERPT_LENGTH);
        excerptInput.value = excerpt;
    }
    
    /**
     * 저장 상태 표시
     */
    showSaveIndicator() {
        const indicator = $('#save-indicator');
        if (indicator) {
            indicator.textContent = '저장되지 않음';
            indicator.className = 'save-indicator unsaved';
        }
    }
    
    /**
     * 미리보기 토글
     */
    togglePreview() {
        const editorContainer = $('#editor-container');
        const previewContainer = $('#preview-container');
        const previewBtn = $('#preview-btn');
        
        if (!editorContainer || !previewContainer) return;
        
        const isPreviewMode = previewContainer.style.display !== 'none';
        
        if (isPreviewMode) {
            // 편집 모드로 전환
            editorContainer.style.display = 'block';
            previewContainer.style.display = 'none';
            previewBtn.textContent = '미리보기';
        } else {
            // 미리보기 모드로 전환
            this.renderPreview();
            editorContainer.style.display = 'none';
            previewContainer.style.display = 'block';
            previewBtn.textContent = '편집';
        }
    }
    
    /**
     * 미리보기 렌더링
     */
    renderPreview() {
        const previewContent = $('#preview-content');
        if (!previewContent) return;
        
        const formData = this.getFormData();
        
        previewContent.innerHTML = `
            <article class="post-preview">
                <header class="post-header">
                    <h1 class="post-title">${formData.title || '제목을 입력하세요'}</h1>
                    <div class="post-meta">
                        <span class="post-author">by ${Auth.getUser()?.name || '작성자'}</span>
                        <span class="post-date">${Utils.date.format(new Date(), 'YYYY년 MM월 DD일')}</span>
                        <span class="post-category">${formData.category || '카테고리'}</span>
                    </div>
                    ${formData.thumbnail ? `<img src="${formData.thumbnail}" alt="썸네일" class="post-thumbnail">` : ''}
                </header>
                <div class="post-content">
                    ${this.editor.innerHTML}
                </div>
                <footer class="post-footer">
                    <div class="post-tags">
                        ${formData.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </footer>
            </article>
        `;
    }
    
    /**
     * 폼 데이터 수집
     */
    getFormData() {
        const titleInput = $('#post-title');
        const excerptInput = $('#post-excerpt');
        const categorySelect = $('#post-category');
        const tagsInput = $('#post-tags');
        const featuredCheck = $('#post-featured');
        const publishedCheck = $('#post-published');
        const thumbnailPreview = $('#thumbnail-preview');
        
        const tags = tagsInput ? tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        const thumbnail = thumbnailPreview ? thumbnailPreview.querySelector('img')?.src : null;
        
        return {
            title: titleInput?.value || '',
            excerpt: excerptInput?.value || '',
            content: this.editor?.innerHTML || '',
            category: categorySelect?.value || '',
            tags: tags,
            featured: featuredCheck?.checked || false,
            published: publishedCheck?.checked || false,
            thumbnail: thumbnail
        };
    }
    
    /**
     * 포스트 저장
     */
    async savePost() {
        try {
            const formData = this.getFormData();
            
            // 유효성 검사
            if (!formData.title.trim()) {
                this.showErrorMessage('제목을 입력해주세요.');
                return;
            }
            
            if (!formData.content.trim()) {
                this.showErrorMessage('내용을 입력해주세요.');
                return;
            }
            
            const saveBtn = $('#save-btn');
            const originalText = saveBtn?.textContent;
            
            if (saveBtn) {
                saveBtn.textContent = '저장 중...';
                saveBtn.disabled = true;
            }
            
            const endpoint = this.isEditMode 
                ? CONFIG.API.ENDPOINTS.UPDATE_POST 
                : CONFIG.API.ENDPOINTS.CREATE_POST;
                
            const data = this.isEditMode 
                ? { ...formData, id: this.postId }
                : formData;
            
            const response = await SheetsAPI.request(endpoint, {
                method: this.isEditMode ? 'PUT' : 'POST',
                data: data
            });
            
            if (response.success) {
                this.isDirty = false;
                this.updateSaveIndicator('saved');
                this.showSuccessMessage('포스트가 저장되었습니다.');
                
                // 새 포스트인 경우 편집 모드로 전환
                if (!this.isEditMode && response.data.id) {
                    this.postId = response.data.id;
                    this.isEditMode = true;
                    this.currentPost = response.data;
                    
                    // URL 업데이트
                    const newUrl = `${window.location.pathname}?id=${this.postId}`;
                    history.replaceState(null, '', newUrl);
                }
                
            } else {
                throw new Error(response.message || '저장에 실패했습니다.');
            }
            
        } catch (error) {
            Utils.log.error('포스트 저장 실패:', error);
            this.showErrorMessage(error.message);
        } finally {
            const saveBtn = $('#save-btn');
            if (saveBtn) {
                saveBtn.textContent = '저장';
                saveBtn.disabled = false;
            }
        }
    }
    
    /**
     * 임시저장
     */
    async saveDraft() {
        const formData = this.getFormData();
        formData.published = false;
        
        try {
            // 로컬 스토리지에 임시저장
            const draftKey = this.isEditMode ? `draft_${this.postId}` : 'draft_new_post';
            Utils.storage.set(draftKey, formData, 24 * 60 * 60 * 1000); // 24시간
            
            this.updateSaveIndicator('draft');
            this.isDirty = false;
            
            Utils.log.info('임시저장 완료');
            
        } catch (error) {
            Utils.log.error('임시저장 실패:', error);
        }
    }
    
    /**
     * 발행
     */
    async publishPost() {
        const formData = this.getFormData();
        formData.published = true;
        
        // 발행 전 확인
        if (!confirm('포스트를 발행하시겠습니까?')) return;
        
        try {
            const publishBtn = $('#publish-btn');
            const originalText = publishBtn?.textContent;
            
            if (publishBtn) {
                publishBtn.textContent = '발행 중...';
                publishBtn.disabled = true;
            }
            
            const endpoint = this.isEditMode 
                ? CONFIG.API.ENDPOINTS.UPDATE_POST 
                : CONFIG.API.ENDPOINTS.CREATE_POST;
                
            const data = this.isEditMode 
                ? { ...formData, id: this.postId }
                : formData;
            
            const response = await SheetsAPI.request(endpoint, {
                method: this.isEditMode ? 'PUT' : 'POST',
                data: data
            });
            
            if (response.success) {
                this.isDirty = false;
                this.showSuccessMessage('포스트가 발행되었습니다.');
                
                // 발행된 포스트로 이동
                setTimeout(() => {
                    window.location.href = `post.html?id=${response.data.id}`;
                }, 2000);
                
            } else {
                throw new Error(response.message || '발행에 실패했습니다.');
            }
            
        } catch (error) {
            Utils.log.error('포스트 발행 실패:', error);
            this.showErrorMessage(error.message);
        } finally {
            const publishBtn = $('#publish-btn');
            if (publishBtn) {
                publishBtn.textContent = '발행';
                publishBtn.disabled = false;
            }
        }
    }
    
    /**
     * 저장 상태 업데이트
     */
    updateSaveIndicator(status) {
        const indicator = $('#save-indicator');
        if (!indicator) return;
        
        switch (status) {
            case 'saved':
                indicator.textContent = '저장됨';
                indicator.className = 'save-indicator saved';
                break;
            case 'draft':
                indicator.textContent = '임시저장됨';
                indicator.className = 'save-indicator draft';
                break;
            case 'saving':
                indicator.textContent = '저장 중...';
                indicator.className = 'save-indicator saving';
                break;
        }
    }
    
    /**
     * 이미지 로딩 표시
     */
    showImageLoading() {
        const loadingId = `loading-${Date.now()}`;
        const loadingHTML = `<div id="${loadingId}" class="image-loading">이미지 업로드 중...</div>`;
        document.execCommand('insertHTML', false, loadingHTML);
        return loadingId;
    }
    
    /**
     * 이미지 로딩 숨김
     */
    hideImageLoading(loadingId) {
        const loadingElement = $(`#${loadingId}`);
        if (loadingElement) {
            loadingElement.remove();
        }
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
        const container = $('#editor-main');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h2>오류가 발생했습니다</h2>
                    <p>${message}</p>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="location.reload()">
                            새로고침
                        </button>
                        <button class="btn btn-secondary" onclick="history.back()">
                            이전 페이지로
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * 소멸자 - 페이지 떠날 때 정리
     */
    destroy() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.editorPage = new EditorPage();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (window.editorPage) {
        window.editorPage.destroy();
    }
});
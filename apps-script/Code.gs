/**
 * Google Apps Script 백엔드 코드
 * OA Design Studio - 오에이디자인스튜디오
 * 
 * 이 파일을 Google Apps Script에 복사하여 사용하세요.
 * 1. script.google.com 에서 새 프로젝트 생성
 * 2. Code.gs 파일에 이 코드 복사
 * 3. 스프레드시트 ID와 권한 설정
 * 4. 웹앱으로 배포
 */

// ================== 설정 ==================

const CONFIG = {
  // 스프레드시트 ID들 (실제 ID로 교체 필요)
  SPREADSHEET_IDS: {
    POSTS: 'YOUR_POSTS_SPREADSHEET_ID',
    COMMENTS: 'YOUR_COMMENTS_SPREADSHEET_ID', 
    SETTINGS: 'YOUR_SETTINGS_SPREADSHEET_ID',
    ARTWORK: 'YOUR_ARTWORK_SPREADSHEET_ID',
    CONTACTS: 'YOUR_CONTACTS_SPREADSHEET_ID'
  },
  
  // 시트 이름들
  SHEET_NAMES: {
    POSTS: 'Posts',
    COMMENTS: 'Comments',
    SETTINGS: 'Settings',
    ARTWORK: 'Artwork',
    CONTACTS: 'Contacts',
    NEWSLETTER: 'Newsletter'
  },
  
  // 관리자 이메일 (권한 확인용)
  ADMIN_EMAILS: [
    'admin@oadstudio.com',
    // 추가 관리자 이메일...
  ],
  
  // 기본 설정
  DEFAULT_SETTINGS: {
    POSTS_PER_PAGE: 9,
    ARTWORK_PER_PAGE: 12,
    SITE_NAME: 'OA Design Studio',
    SITE_URL: 'https://oadsite.github.io'
  }
};

// ================== 메인 핸들러 ==================

/**
 * HTTP 요청 처리 (GET)
 */
function doGet(e) {
  return handleRequest(e);
}

/**
 * HTTP 요청 처리 (POST)  
 */
function doPost(e) {
  return handleRequest(e);
}

/**
 * 요청 라우팅
 */
function handleRequest(e) {
  try {
    // CORS 헤더 설정
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // 요청 파라미터 파싱
    const params = e.parameter || {};
    const path = params.path || '';
    const method = e.method || 'GET';
    
    // POST 데이터 파싱
    let postData = {};
    if (method === 'POST' && e.postData) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = {};
      }
    }
    
    console.log(`Request: ${method} ${path}`, postData);
    
    // 라우팅
    let result;
    switch (path) {
      // 인증 관련
      case '/auth/login':
        result = handleLogin(postData);
        break;
      case '/auth/logout':
        result = handleLogout();
        break;
      case '/auth/check':
        result = handleAuthCheck();
        break;
        
      // 포스트 관련  
      case '/api/posts':
        result = method === 'GET' ? getPosts(params) : createPost(postData);
        break;
      case '/api/post':
        result = getPost(params);
        break;
      case '/api/post/create':
        result = createPost(postData);
        break;
      case '/api/post/update':
        result = updatePost(postData);
        break;
      case '/api/post/delete':
        result = deletePost(postData);
        break;
      case '/api/post/view':
        result = incrementViewCount(postData);
        break;
        
      // 댓글 관련
      case '/api/comments':
        result = getComments(params);
        break;
      case '/api/comment/create':
        result = createComment(postData);
        break;
      case '/api/comment/delete':
        result = deleteComment(postData);
        break;
        
      // 아트워크 관련
      case '/api/artwork':
        result = method === 'GET' ? getArtwork(params) : createArtwork(postData);
        break;
      case '/api/artwork/create':
        result = createArtwork(postData);
        break;
      case '/api/artwork/update':
        result = updateArtwork(postData);
        break;
      case '/api/artwork/delete':
        result = deleteArtwork(postData);
        break;
        
      // 파일 업로드
      case '/api/upload/image':
        result = uploadImage(postData);
        break;
      case '/api/upload/video':
        result = uploadVideo(postData);
        break;
        
      // 연락처 및 뉴스레터
      case '/api/contact':
        result = handleContact(postData);
        break;
      case '/api/newsletter/subscribe':
        result = subscribeNewsletter(postData);
        break;
        
      // 검색
      case '/api/search':
        result = searchContent(params);
        break;
        
      // 설정
      case '/api/settings':
        result = method === 'GET' ? getSettings() : updateSettings(postData);
        break;
        
      default:
        result = { success: false, message: '요청된 엔드포인트를 찾을 수 없습니다.' };
    }
    
    output.setContent(JSON.stringify(result));
    return output;
    
  } catch (error) {
    console.error('Request handling error:', error);
    
    const errorResponse = {
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.toString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ================== 인증 관련 ==================

/**
 * 로그인 처리
 */
function handleLogin(data) {
  const { email, password } = data;
  
  // 간단한 인증 (실제로는 더 안전한 방법 필요)
  if (CONFIG.ADMIN_EMAILS.includes(email) && password === 'admin123') {
    return {
      success: true,
      user: {
        id: 'admin',
        email: email,
        name: '관리자',
        role: 'admin',
        avatar: null
      },
      permissions: ['read', 'write', 'delete', 'admin']
    };
  }
  
  return {
    success: false,
    message: '이메일 또는 비밀번호가 올바르지 않습니다.'
  };
}

/**
 * 로그아웃 처리
 */
function handleLogout() {
  return { success: true };
}

/**
 * 인증 상태 확인
 */
function handleAuthCheck() {
  // 실제로는 세션 토큰 검증 필요
  return { success: true, valid: true };
}

/**
 * 관리자 권한 확인
 */
function isAdmin(email) {
  return CONFIG.ADMIN_EMAILS.includes(email);
}

// ================== 포스트 관련 ==================

/**
 * 포스트 목록 조회
 */
function getPosts(params) {
  try {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || CONFIG.DEFAULT_SETTINGS.POSTS_PER_PAGE;
    const search = params.search || '';
    const category = params.category || '';
    const tag = params.tag || '';
    const featured = params.featured === 'true';
    
    const sheet = getSheet('POSTS');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // 데이터를 객체 배열로 변환
    let posts = rows.map(row => {
      const post = {};
      headers.forEach((header, index) => {
        post[header] = row[index];
      });
      
      // 데이터 타입 변환
      post.tags = post.tags ? post.tags.split(',').map(t => t.trim()) : [];
      post.featured = post.featured === 'TRUE';
      post.published = post.published === 'TRUE';
      post.viewCount = parseInt(post.viewCount) || 0;
      post.commentCount = parseInt(post.commentCount) || 0;
      
      return post;
    });
    
    // 필터링
    if (search) {
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.content.toLowerCase().includes(search.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (category) {
      posts = posts.filter(post => post.category === category);
    }
    
    if (tag) {
      posts = posts.filter(post => post.tags.includes(tag));
    }
    
    if (featured) {
      posts = posts.filter(post => post.featured);
    }
    
    // 발행된 것만 (관리자가 아닌 경우)
    posts = posts.filter(post => post.published);
    
    // 정렬 (최신순)
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
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
    
  } catch (error) {
    console.error('getPosts error:', error);
    return {
      success: false,
      message: '포스트 목록을 가져오는데 실패했습니다.'
    };
  }
}

/**
 * 단일 포스트 조회
 */
function getPost(params) {
  try {
    const id = params.id;
    if (!id) {
      return { success: false, message: '포스트 ID가 필요합니다.' };
    }
    
    const sheet = getSheet('POSTS');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const postRow = rows.find(row => row[0] === id); // ID는 첫 번째 컬럼
    
    if (!postRow) {
      return { success: false, message: '포스트를 찾을 수 없습니다.' };
    }
    
    const post = {};
    headers.forEach((header, index) => {
      post[header] = postRow[index];
    });
    
    // 데이터 타입 변환
    post.tags = post.tags ? post.tags.split(',').map(t => t.trim()) : [];
    post.featured = post.featured === 'TRUE';
    post.published = post.published === 'TRUE';
    post.viewCount = parseInt(post.viewCount) || 0;
    post.commentCount = parseInt(post.commentCount) || 0;
    
    return {
      success: true,
      data: post
    };
    
  } catch (error) {
    console.error('getPost error:', error);
    return {
      success: false,
      message: '포스트를 가져오는데 실패했습니다.'
    };
  }
}

/**
 * 포스트 생성
 */
function createPost(data) {
  try {
    const sheet = getSheet('POSTS');
    const id = generateId();
    const now = new Date().toISOString();
    
    const newRow = [
      id,
      data.title || '',
      data.content || '',
      data.excerpt || '',
      data.author || '관리자',
      data.category || '기타',
      data.tags ? data.tags.join(', ') : '',
      data.featured ? 'TRUE' : 'FALSE',
      data.published ? 'TRUE' : 'FALSE',
      now, // createdAt
      now, // updatedAt
      data.thumbnail || '',
      0, // viewCount
      0  // commentCount
    ];
    
    sheet.appendRow(newRow);
    
    return {
      success: true,
      data: {
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
        viewCount: 0,
        commentCount: 0
      },
      message: '포스트가 생성되었습니다.'
    };
    
  } catch (error) {
    console.error('createPost error:', error);
    return {
      success: false,
      message: '포스트 생성에 실패했습니다.'
    };
  }
}

/**
 * 포스트 수정
 */
function updatePost(data) {
  try {
    const sheet = getSheet('POSTS');
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    
    const rowIndex = values.findIndex(row => row[0] === data.id);
    if (rowIndex === -1) {
      return { success: false, message: '포스트를 찾을 수 없습니다.' };
    }
    
    // 업데이트할 데이터 준비
    const updatedRow = [...values[rowIndex]];
    updatedRow[headers.indexOf('title')] = data.title || updatedRow[headers.indexOf('title')];
    updatedRow[headers.indexOf('content')] = data.content || updatedRow[headers.indexOf('content')];
    updatedRow[headers.indexOf('excerpt')] = data.excerpt || updatedRow[headers.indexOf('excerpt')];
    updatedRow[headers.indexOf('category')] = data.category || updatedRow[headers.indexOf('category')];
    updatedRow[headers.indexOf('tags')] = data.tags ? data.tags.join(', ') : updatedRow[headers.indexOf('tags')];
    updatedRow[headers.indexOf('featured')] = data.featured ? 'TRUE' : 'FALSE';
    updatedRow[headers.indexOf('published')] = data.published ? 'TRUE' : 'FALSE';
    updatedRow[headers.indexOf('updatedAt')] = new Date().toISOString();
    updatedRow[headers.indexOf('thumbnail')] = data.thumbnail || updatedRow[headers.indexOf('thumbnail')];
    
    // 시트 업데이트
    sheet.getRange(rowIndex + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
    
    return {
      success: true,
      data: data,
      message: '포스트가 수정되었습니다.'
    };
    
  } catch (error) {
    console.error('updatePost error:', error);
    return {
      success: false,
      message: '포스트 수정에 실패했습니다.'
    };
  }
}

/**
 * 포스트 삭제
 */
function deletePost(data) {
  try {
    const sheet = getSheet('POSTS');
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    const rowIndex = values.findIndex(row => row[0] === data.id);
    if (rowIndex === -1) {
      return { success: false, message: '포스트를 찾을 수 없습니다.' };
    }
    
    sheet.deleteRow(rowIndex + 1);
    
    return {
      success: true,
      message: '포스트가 삭제되었습니다.'
    };
    
  } catch (error) {
    console.error('deletePost error:', error);
    return {
      success: false,
      message: '포스트 삭제에 실패했습니다.'
    };
  }
}

/**
 * 조회수 증가
 */
function incrementViewCount(data) {
  try {
    const sheet = getSheet('POSTS');
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    
    const rowIndex = values.findIndex(row => row[0] === data.id);
    if (rowIndex === -1) {
      return { success: false, message: '포스트를 찾을 수 없습니다.' };
    }
    
    const viewCountIndex = headers.indexOf('viewCount');
    const currentCount = parseInt(values[rowIndex][viewCountIndex]) || 0;
    
    sheet.getRange(rowIndex + 1, viewCountIndex + 1).setValue(currentCount + 1);
    
    return { success: true };
    
  } catch (error) {
    console.error('incrementViewCount error:', error);
    return { success: false, message: '조회수 업데이트에 실패했습니다.' };
  }
}

// ================== 댓글 관련 ==================

/**
 * 댓글 목록 조회
 */
function getComments(params) {
  try {
    const postId = params.postId;
    if (!postId) {
      return { success: false, message: '포스트 ID가 필요합니다.' };
    }
    
    const sheet = getSheet('COMMENTS');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    let comments = rows
      .filter(row => row[headers.indexOf('postId')] === postId)
      .filter(row => row[headers.indexOf('approved')] === 'TRUE')
      .map(row => {
        const comment = {};
        headers.forEach((header, index) => {
          comment[header] = row[index];
        });
        comment.approved = comment.approved === 'TRUE';
        return comment;
      });
    
    // 최신순 정렬
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
      success: true,
      data: comments
    };
    
  } catch (error) {
    console.error('getComments error:', error);
    return {
      success: false,
      message: '댓글을 가져오는데 실패했습니다.'
    };
  }
}

/**
 * 댓글 생성
 */
function createComment(data) {
  try {
    const sheet = getSheet('COMMENTS');
    const id = generateId();
    const now = new Date().toISOString();
    
    const newRow = [
      id,
      data.postId || '',
      data.author || '',
      data.email || '',
      data.content || '',
      now, // createdAt
      'FALSE' // approved (기본적으로 승인 대기)
    ];
    
    sheet.appendRow(newRow);
    
    // 포스트의 댓글 수 업데이트
    updatePostCommentCount(data.postId);
    
    return {
      success: true,
      data: {
        id,
        ...data,
        createdAt: now,
        approved: false
      },
      message: '댓글이 등록되었습니다. 승인 후 표시됩니다.'
    };
    
  } catch (error) {
    console.error('createComment error:', error);
    return {
      success: false,
      message: '댓글 등록에 실패했습니다.'
    };
  }
}

/**
 * 댓글 삭제
 */
function deleteComment(data) {
  try {
    const sheet = getSheet('COMMENTS');
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    const rowIndex = values.findIndex(row => row[0] === data.id);
    if (rowIndex === -1) {
      return { success: false, message: '댓글을 찾을 수 없습니다.' };
    }
    
    const postId = values[rowIndex][1]; // postId 저장
    sheet.deleteRow(rowIndex + 1);
    
    // 포스트의 댓글 수 업데이트
    updatePostCommentCount(postId);
    
    return {
      success: true,
      message: '댓글이 삭제되었습니다.'
    };
    
  } catch (error) {
    console.error('deleteComment error:', error);
    return {
      success: false,
      message: '댓글 삭제에 실패했습니다.'
    };
  }
}

/**
 * 포스트 댓글 수 업데이트
 */
function updatePostCommentCount(postId) {
  try {
    const commentsSheet = getSheet('COMMENTS');
    const postsSheet = getSheet('POSTS');
    
    // 승인된 댓글 수 계산
    const commentsData = commentsSheet.getDataRange().getValues();
    const commentsHeaders = commentsData[0];
    const commentCount = commentsData.slice(1)
      .filter(row => row[commentsHeaders.indexOf('postId')] === postId)
      .filter(row => row[commentsHeaders.indexOf('approved')] === 'TRUE')
      .length;
    
    // 포스트 시트에서 해당 포스트 찾아서 업데이트
    const postsData = postsSheet.getDataRange().getValues();
    const postsHeaders = postsData[0];
    const postRowIndex = postsData.findIndex(row => row[0] === postId);
    
    if (postRowIndex !== -1) {
      const commentCountIndex = postsHeaders.indexOf('commentCount');
      postsSheet.getRange(postRowIndex + 1, commentCountIndex + 1).setValue(commentCount);
    }
    
  } catch (error) {
    console.error('updatePostCommentCount error:', error);
  }
}

// ================== 아트워크 관련 ==================

/**
 * 아트워크 목록 조회
 */
function getArtwork(params) {
  try {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || CONFIG.DEFAULT_SETTINGS.ARTWORK_PER_PAGE;
    const category = params.category || '';
    
    const sheet = getSheet('ARTWORK');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    let artwork = rows.map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index];
      });
      item.tags = item.tags ? item.tags.split(',').map(t => t.trim()) : [];
      return item;
    });
    
    // 카테고리 필터링
    if (category) {
      artwork = artwork.filter(item => item.category === category);
    }
    
    // 최신순 정렬
    artwork.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
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
    
  } catch (error) {
    console.error('getArtwork error:', error);
    return {
      success: false,
      message: '아트워크 목록을 가져오는데 실패했습니다.'
    };
  }
}

/**
 * 아트워크 생성
 */
function createArtwork(data) {
  try {
    const sheet = getSheet('ARTWORK');
    const id = generateId();
    const now = new Date().toISOString();
    
    const newRow = [
      id,
      data.title || '',
      data.description || '',
      data.category || '기타',
      data.image || '',
      data.thumbnail || data.image || '',
      data.tags ? data.tags.join(', ') : '',
      now // createdAt
    ];
    
    sheet.appendRow(newRow);
    
    return {
      success: true,
      data: {
        id,
        ...data,
        createdAt: now
      },
      message: '아트워크가 추가되었습니다.'
    };
    
  } catch (error) {
    console.error('createArtwork error:', error);
    return {
      success: false,
      message: '아트워크 추가에 실패했습니다.'
    };
  }
}

/**
 * 아트워크 수정
 */
function updateArtwork(data) {
  try {
    const sheet = getSheet('ARTWORK');
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    
    const rowIndex = values.findIndex(row => row[0] === data.id);
    if (rowIndex === -1) {
      return { success: false, message: '아트워크를 찾을 수 없습니다.' };
    }
    
    const updatedRow = [...values[rowIndex]];
    updatedRow[headers.indexOf('title')] = data.title || updatedRow[headers.indexOf('title')];
    updatedRow[headers.indexOf('description')] = data.description || updatedRow[headers.indexOf('description')];
    updatedRow[headers.indexOf('category')] = data.category || updatedRow[headers.indexOf('category')];
    updatedRow[headers.indexOf('image')] = data.image || updatedRow[headers.indexOf('image')];
    updatedRow[headers.indexOf('thumbnail')] = data.thumbnail || updatedRow[headers.indexOf('thumbnail')];
    updatedRow[headers.indexOf('tags')] = data.tags ? data.tags.join(', ') : updatedRow[headers.indexOf('tags')];
    
    sheet.getRange(rowIndex + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
    
    return {
      success: true,
      data: data,
      message: '아트워크가 수정되었습니다.'
    };
    
  } catch (error) {
    console.error('updateArtwork error:', error);
    return {
      success: false,
      message: '아트워크 수정에 실패했습니다.'
    };
  }
}

/**
 * 아트워크 삭제
 */
function deleteArtwork(data) {
  try {
    const sheet = getSheet('ARTWORK');
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    const rowIndex = values.findIndex(row => row[0] === data.id);
    if (rowIndex === -1) {
      return { success: false, message: '아트워크를 찾을 수 없습니다.' };
    }
    
    sheet.deleteRow(rowIndex + 1);
    
    return {
      success: true,
      message: '아트워크가 삭제되었습니다.'
    };
    
  } catch (error) {
    console.error('deleteArtwork error:', error);
    return {
      success: false,
      message: '아트워크 삭제에 실패했습니다.'
    };
  }
}

// ================== 파일 업로드 ==================

/**
 * 이미지 업로드
 */
function uploadImage(data) {
  try {
    // Google Drive에 이미지 저장
    const blob = Utilities.newBlob(
      Utilities.base64Decode(data.file.split(',')[1]),
      'image/jpeg',
      data.filename
    );
    
    const folder = DriveApp.getFolderById('YOUR_DRIVE_FOLDER_ID'); // 실제 폴더 ID 필요
    const file = folder.createFile(blob);
    
    // 공개 설정
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      success: true,
      data: {
        url: `https://drive.google.com/uc?id=${file.getId()}`,
        filename: data.filename,
        size: data.size
      }
    };
    
  } catch (error) {
    console.error('uploadImage error:', error);
    return {
      success: false,
      message: '이미지 업로드에 실패했습니다.'
    };
  }
}

/**
 * 비디오 업로드
 */
function uploadVideo(data) {
  try {
    // Google Drive에 비디오 저장
    const blob = Utilities.newBlob(
      Utilities.base64Decode(data.file.split(',')[1]),
      'video/mp4',
      data.filename
    );
    
    const folder = DriveApp.getFolderById('YOUR_DRIVE_FOLDER_ID'); // 실제 폴더 ID 필요
    const file = folder.createFile(blob);
    
    // 공개 설정
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      success: true,
      data: {
        url: `https://drive.google.com/uc?id=${file.getId()}`,
        filename: data.filename,
        size: data.size
      }
    };
    
  } catch (error) {
    console.error('uploadVideo error:', error);
    return {
      success: false,
      message: '비디오 업로드에 실패했습니다.'
    };
  }
}

// ================== 연락처 및 뉴스레터 ==================

/**
 * 연락처 폼 처리
 */
function handleContact(data) {
  try {
    const sheet = getSheet('CONTACTS');
    const id = generateId();
    const now = new Date().toISOString();
    
    const newRow = [
      id,
      data.name || '',
      data.email || '',
      data.subject || '',
      data.message || '',
      now, // timestamp
      'NEW' // status
    ];
    
    sheet.appendRow(newRow);
    
    // 이메일 알림 발송 (선택사항)
    try {
      MailApp.sendEmail({
        to: CONFIG.ADMIN_EMAILS[0],
        subject: `[OA Design Studio] 새 문의: ${data.subject}`,
        body: `
새로운 문의가 접수되었습니다.

이름: ${data.name}
이메일: ${data.email}
제목: ${data.subject}
내용: ${data.message}

시간: ${now}
        `
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
    }
    
    return {
      success: true,
      message: '문의가 성공적으로 접수되었습니다.'
    };
    
  } catch (error) {
    console.error('handleContact error:', error);
    return {
      success: false,
      message: '문의 전송에 실패했습니다.'
    };
  }
}

/**
 * 뉴스레터 구독
 */
function subscribeNewsletter(data) {
  try {
    const sheet = getSheet('NEWSLETTER');
    const email = data.email;
    
    // 중복 확인
    const existingData = sheet.getDataRange().getValues();
    const isDuplicate = existingData.some(row => row[1] === email);
    
    if (isDuplicate) {
      return {
        success: false,
        message: '이미 구독된 이메일입니다.'
      };
    }
    
    const id = generateId();
    const now = new Date().toISOString();
    
    const newRow = [
      id,
      email,
      now, // subscribedAt
      'ACTIVE' // status
    ];
    
    sheet.appendRow(newRow);
    
    return {
      success: true,
      message: '뉴스레터 구독이 완료되었습니다.'
    };
    
  } catch (error) {
    console.error('subscribeNewsletter error:', error);
    return {
      success: false,
      message: '뉴스레터 구독에 실패했습니다.'
    };
  }
}

// ================== 검색 ==================

/**
 * 콘텐츠 검색
 */
function searchContent(params) {
  try {
    const query = params.query || '';
    const type = params.type || 'all';
    
    if (query.length < 2) {
      return {
        success: false,
        message: '검색어는 2글자 이상 입력해주세요.'
      };
    }
    
    let results = [];
    
    // 포스트 검색
    if (type === 'all' || type === 'posts') {
      const postsResult = getPosts({ search: query, limit: 50 });
      if (postsResult.success) {
        results = results.concat(postsResult.data.posts.map(post => ({
          ...post,
          type: 'post'
        })));
      }
    }
    
    // 아트워크 검색
    if (type === 'all' || type === 'artwork') {
      const artworkSheet = getSheet('ARTWORK');
      const artworkData = artworkSheet.getDataRange().getValues();
      const artworkHeaders = artworkData[0];
      
      const artworkResults = artworkData.slice(1)
        .filter(row => {
          const title = row[artworkHeaders.indexOf('title')] || '';
          const description = row[artworkHeaders.indexOf('description')] || '';
          const tags = row[artworkHeaders.indexOf('tags')] || '';
          
          return title.toLowerCase().includes(query.toLowerCase()) ||
                 description.toLowerCase().includes(query.toLowerCase()) ||
                 tags.toLowerCase().includes(query.toLowerCase());
        })
        .map(row => {
          const item = {};
          artworkHeaders.forEach((header, index) => {
            item[header] = row[index];
          });
          item.type = 'artwork';
          item.tags = item.tags ? item.tags.split(',').map(t => t.trim()) : [];
          return item;
        });
      
      results = results.concat(artworkResults);
    }
    
    // 최신순 정렬
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
      success: true,
      data: {
        query,
        results: results.slice(0, 20), // 최대 20개 결과
        total: results.length
      }
    };
    
  } catch (error) {
    console.error('searchContent error:', error);
    return {
      success: false,
      message: '검색에 실패했습니다.'
    };
  }
}

// ================== 설정 ==================

/**
 * 설정 조회
 */
function getSettings() {
  try {
    const sheet = getSheet('SETTINGS');
    const data = sheet.getDataRange().getValues();
    
    const settings = {};
    data.forEach(row => {
      settings[row[0]] = row[1]; // key, value
    });
    
    return {
      success: true,
      data: { ...CONFIG.DEFAULT_SETTINGS, ...settings }
    };
    
  } catch (error) {
    console.error('getSettings error:', error);
    return {
      success: true,
      data: CONFIG.DEFAULT_SETTINGS
    };
  }
}

/**
 * 설정 업데이트
 */
function updateSettings(data) {
  try {
    const sheet = getSheet('SETTINGS');
    
    Object.entries(data).forEach(([key, value]) => {
      const existingData = sheet.getDataRange().getValues();
      const rowIndex = existingData.findIndex(row => row[0] === key);
      
      if (rowIndex !== -1) {
        // 기존 설정 업데이트
        sheet.getRange(rowIndex + 1, 2).setValue(value);
      } else {
        // 새 설정 추가
        sheet.appendRow([key, value]);
      }
    });
    
    return {
      success: true,
      message: '설정이 업데이트되었습니다.'
    };
    
  } catch (error) {
    console.error('updateSettings error:', error);
    return {
      success: false,
      message: '설정 업데이트에 실패했습니다.'
    };
  }
}

// ================== 유틸리티 함수 ==================

/**
 * 스프레드시트 시트 가져오기
 */
function getSheet(sheetType) {
  const spreadsheetId = CONFIG.SPREADSHEET_IDS[sheetType];
  const sheetName = CONFIG.SHEET_NAMES[sheetType];
  
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  // 시트가 없으면 생성
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    initializeSheet(sheet, sheetType);
  }
  
  return sheet;
}

/**
 * 시트 초기화 (헤더 설정)
 */
function initializeSheet(sheet, sheetType) {
  let headers = [];
  
  switch (sheetType) {
    case 'POSTS':
      headers = ['id', 'title', 'content', 'excerpt', 'author', 'category', 'tags', 'featured', 'published', 'createdAt', 'updatedAt', 'thumbnail', 'viewCount', 'commentCount'];
      break;
    case 'COMMENTS':
      headers = ['id', 'postId', 'author', 'email', 'content', 'createdAt', 'approved'];
      break;
    case 'ARTWORK':
      headers = ['id', 'title', 'description', 'category', 'image', 'thumbnail', 'tags', 'createdAt'];
      break;
    case 'CONTACTS':
      headers = ['id', 'name', 'email', 'subject', 'message', 'timestamp', 'status'];
      break;
    case 'NEWSLETTER':
      headers = ['id', 'email', 'subscribedAt', 'status'];
      break;
    case 'SETTINGS':
      headers = ['key', 'value'];
      break;
  }
  
  if (headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
}

/**
 * 고유 ID 생성
 */
function generateId() {
  return Utilities.getUuid();
}

/**
 * 현재 시간 반환
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}
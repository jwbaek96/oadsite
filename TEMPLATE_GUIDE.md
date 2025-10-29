# 템플릿 시스템 사용법

## 개요
OA Design Studio 블로그는 푸터와 헤더를 템플릿으로 분리하여 관리하는 시스템을 사용합니다.

## 파일 구조
```
templates/
├── footer.html    # 푸터 템플릿
└── header.html    # 헤더 템플릿 (추후 추가 예정)

js/
└── templates.js   # 템플릿 로더
```

## 기본 사용법

### 1. 자동 로드 (권장)
각 HTML 페이지에서 `templates.js`를 포함하면 푸터가 자동으로 로드됩니다:

```html
<script src="./js/templates.js"></script>
```

### 2. 수동 로드
특정 타이밍에 푸터를 로드하려면:

```javascript
// 기본 사용
loadFooter();

// 옵션과 함께 사용
loadFooter('body', {
    variables: {
        currentYear: 2024,
        companyName: 'OA Design Studio'
    }
});
```

### 3. 자동 로드 비활성화
자동 로드를 원하지 않는 페이지에서는 body 태그에 속성을 추가:

```html
<body data-no-auto-footer>
```

## 템플릿 변수
템플릿 내에서 `{{변수명}}` 형태로 변수를 사용할 수 있습니다:

```html
<!-- templates/footer.html -->
<p>&copy; {{currentYear}} {{companyName}}</p>
```

## API 함수들

### loadFooter(target, options)
- `target`: 푸터를 삽입할 대상 (기본값: 'body')
- `options`: 설정 옵션

### loadTemplate(templateName, target, options)
- `templateName`: 템플릿 파일명 (확장자 제외)
- `target`: 삽입할 대상
- `options`: 설정 옵션

### templateLoader.clearCache()
템플릿 캐시를 지웁니다.

## 이벤트
템플릿 로드 완료 시 `templateLoaded` 이벤트가 발생합니다:

```javascript
document.addEventListener('templateLoaded', (e) => {
    console.log('템플릿 로드 완료:', e.detail.templateName);
});
```

## 주요 기능

### 1. 캐싱
템플릿은 한 번 로드되면 메모리에 캐시되어 성능을 향상시킵니다.

### 2. 변수 치환
템플릿 내의 `{{변수명}}` 패턴이 실제 값으로 치환됩니다.

### 3. 후처리 콜백
템플릿 로드 후 실행할 콜백 함수를 지정할 수 있습니다.

### 4. 오류 처리
템플릿 로드 실패 시 적절한 오류 처리가 수행됩니다.

## 새 템플릿 추가하기

1. `templates/` 폴더에 새 HTML 파일 생성
2. 필요시 `templates.js`에 전용 로드 함수 추가
3. 각 페이지에서 호출

```javascript
// 새 템플릿 로드 예시
await loadTemplate('header', 'body', {
    insertMethod: 'insertAdjacentHTML',
    position: 'afterbegin'
});
```
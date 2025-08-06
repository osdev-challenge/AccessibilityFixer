# Web A11y Fixer Extension

웹 접근성(Web Accessibility)을 개선하기 위한 VS Code 확장 프로그램입니다.  
AI 분석을 통해 접근성 문제가 감지되면 해당 위치에 **진단(Diagnostic)** 정보를 표시하고, 사용자가 빠르게 수정할 수 있도록 **Quick Fix (자동 수정)** 기능을 제공합니다.

---

## ✨ Features

- ✅ eslint-plugin-jsx-a11y 라이브러리를 참고하여 주요 접근성 규칙을 기반으로 구현

예시:

문제가 발생한 코드에 진단 메시지가 노란색 밑줄로 표시되고, Quick Fix도 함께 제공됩니다.

---

## 📁 폴더 구조

```
web-a11y-fixer-extension/
├── package.json # 확장 프로그램 설정 (명령어, activationEvents 등)
├── src/
│ ├── extension.ts # 확장 진입점
│ ├── ruleDispatcher.ts # 규칙 이름 → 처리 함수 실행 (AI/로직 기반 분기 포함)
│ ├── rules/ # 각 규칙 처리 모듈 (로직 또는 AI 기반)
│ │ ├── ai/ # AI 기반 수정 규칙(함수 단위로 파일 구성)
│ │ ├── logic/ # 로직 기반 자동 수정 규칙(함수 단위로 파일 구성)
│ │ └── types.ts # 규칙 처리 함수 타입 등 공통 타입 정의
│ ├── ai/
│ │ ├── aiClient.ts # GPT API 요청 및 응답 처리
│ │ ├── contextExtractor.ts # AI 입력용 코드 context 추출
│ │ └── prompt/ # AI 프롬프트
│ ├── utils/ # 공통 유틸 함수들
│ └── constants.ts # 규칙명 목록, 설정 상수 등
├── test/ # 테스트용 예시 파일
└── README.md # 확장 설명 및 설치 안내
```

---

## 🔖 커밋 메시지 컨벤션

| 타입        | 설명              | 예시                    |
| ----------- | ----------------- | ----------------------- |
| 🎉 init     | 초기 세팅         | init: 프로젝트 세팅     |
| ✨ feature  | 새로운 기능       | feat: 기능 추가         |
| 🐛 fix      | 버그 수정         | fix: 버그 수정          |
| 💄 style    | 스타일 변경       | style: 스타일 수정      |
| ♻️ refactor | 코드 리팩토링     | refactor: 코드 리펙토링 |
| 📝 docs     | 문서 수정         | docs: README 업데이트   |
| ✏️ chore    | 설정 변경 등 기타 | chore: 설정             |

---

## 🙌 PR 방법

1. 이슈 생성 → #번호 자동 부여됨
2. feature/#번호 형태의 브랜치 생성
3. 작업 후 main 브랜치로 PR 생성
4. main 머지

---

## 🚀 실행 방법

### 1. 레포지토리 클론

```bash
git clone https://github.com/osdev-challenge/web-a11y-fixer-extension.git
cd web-a11y-fixer-extension
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 컴파일

```bash
npm run compile
```

### 4. VS Code에서 실행

    1.	VS Code에서 web-a11y-fixer-extension 폴더를 엽니다.
    2.	F5 키를 눌러 Extension Development Host 실행.
    3.	실행된 새 VS Code 창에서 확장 기능을 테스트합니다.

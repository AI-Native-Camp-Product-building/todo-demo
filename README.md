# Callable Todo

할 일 관리 + 날씨 API 연동 데모 프로젝트.
**당기기**(외부 API 가져오기)와 **열어주기**(내 프로덕트를 외부에서 호출 가능하게 만들기)를 실습합니다.

---

## 1. 설치

```bash
npm install
```

---

## 2. 당기기 — 날씨 API 연결

### 2-1. WeatherAPI.com 가입 및 API 키 발급

1. [weatherapi.com](https://www.weatherapi.com)에 접속하여 **Sign Up** 클릭
2. 이메일, 비밀번호 입력 후 가입
3. 가입 즉시 대시보드에서 API 키 확인 가능 — 복사
4. 무료 플랜: 월 100만 콜 (실습용으로 충분)

### 2-2. .env 설정

`.env.example`을 복사하여 `.env` 파일을 만듭니다.

```bash
cp .env.example .env
```

`.env` 파일을 열고 발급받은 키를 넣습니다.

```
WEATHER_API_KEY=발급받은_키_붙여넣기
AUTH_TOKEN=my-secret-token-1234
```

> `.env` 파일은 절대 GitHub에 올리지 마세요. API 키가 유출되면 다른 사람이 내 이름으로 호출할 수 있습니다.

### 2-3. 서버 실행

```bash
npm start
```

브라우저에서 `http://localhost:3000` 접속하면 투두 대시보드와 날씨 정보가 표시됩니다.
비가 오면 "우산 챙기기", 영하면 "두꺼운 옷 준비하기" 등 날씨 기반 할 일이 자동으로 제안됩니다.

---

## 3. 열어주기 — 내 프로덕트를 외부에서 호출 가능하게

### 3-1. REST API (토큰 인증)

서버가 실행 중이면 외부에서 아래 API를 호출할 수 있습니다.

```bash
curl http://localhost:3000/api/v1/today \
  -H "Authorization: Bearer my-secret-token-1234"
```

응답 예시:

```json
{
  "date": "2026. 4. 7.",
  "todos": [
    { "id": 1, "text": "캠프 과제 제출하기", "done": false },
    { "id": 2, "text": "점심 약속 — 성수동", "done": false }
  ],
  "weather": { "city": "Seoul", "temp": 18, "description": "흐림" },
  "suggestions": ["우산 챙기기"]
}
```

토큰 없이 호출하면 `401 인증 실패` 에러가 반환됩니다.

---

## 파일 구조

```
todo-demo/
├── .env.example    # API 키 placeholder (이걸 복사해서 .env 생성)
├── package.json    # 의존성 (express, dotenv, @modelcontextprotocol/sdk)
├── server.js       # 웹 서버 — 당기기(날씨 API) + 열어주기(REST API)
├── mcp-server.js   # MCP 서버 — Claude Code에서 호출 가능
└── public/
    └── index.html  # 대시보드 UI
```

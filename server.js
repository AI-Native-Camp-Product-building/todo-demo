// callable-todo: 당기기 + 열어주기 데모
// Product Camp 3강 실습용

require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

// ─── 투두 데이터 (간단히 메모리에 저장) ─────────────────────
let todos = [
  { id: 1, text: "캠프 과제 제출하기", done: false },
  { id: 2, text: "점심 약속 — 성수동", done: false },
  { id: 3, text: "저녁 러닝 30분", done: false },
];

// ─── [당기기] 날씨 API 호출 ─────────────────────────────────
async function getWeather(city = "Seoul") {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return { error: "WEATHER_API_KEY가 .env에 설정되지 않았습니다." };
  }

  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&lang=ko`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    return { error: data.error.message };
  }

  return {
    city: data.location.name,
    temp: Math.round(data.current.temp_c),
    description: data.current.condition.text,
    icon: data.current.condition.icon,
    humidity: data.current.humidity,
    wind: data.current.wind_kph,
  };
}

// ─── [당기기] 날씨 기반 할 일 제안 ──────────────────────────
function suggestTodos(weather) {
  const suggestions = [];

  if (weather.description?.includes("비") || weather.description?.includes("소나기")) {
    suggestions.push("우산 챙기기");
  }
  if (weather.temp <= 0) {
    suggestions.push("두꺼운 옷 준비하기");
  }
  if (weather.temp >= 33) {
    suggestions.push("물병 챙기기");
  }
  if (weather.wind >= 30) {
    suggestions.push("바람 강함 — 야외 일정 확인하기");
  }

  return suggestions;
}

// ─── [열어주기] 인증 미들웨어 ────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const validToken = process.env.AUTH_TOKEN;

  if (!validToken || token !== validToken) {
    return res.status(401).json({ error: "인증 실패 — 유효한 토큰이 필요합니다." });
  }
  next();
}

// ─── 내부 API (프론트엔드용, 인증 없음) ─────────────────────
app.get("/todos", (req, res) => {
  res.json(todos);
});

app.get("/weather", async (req, res) => {
  const weather = await getWeather(req.query.city || "Seoul");
  const suggestions = weather.error ? [] : suggestTodos(weather);
  res.json({ weather, suggestions });
});

app.post("/todos", (req, res) => {
  const newTodo = {
    id: Date.now(),
    text: req.body.text,
    done: false,
  };
  todos.push(newTodo);
  res.json(newTodo);
});

// ─── [열어주기] 외부 API (인증 필요) ────────────────────────
app.get("/api/v1/today", authMiddleware, async (req, res) => {
  const weather = await getWeather("Seoul");
  const suggestions = weather.error ? [] : suggestTodos(weather);

  res.json({
    date: new Date().toLocaleDateString("ko-KR"),
    todos: todos,
    weather: weather,
    suggestions: suggestions,
  });
});

// ─── 서버 시작 ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`callable-todo 실행 중: http://localhost:${PORT}`);
  console.log(`외부 API: GET /api/v1/today (Authorization: Bearer <토큰>)`);
});

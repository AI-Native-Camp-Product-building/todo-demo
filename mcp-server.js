// callable-todo MCP 서버 — 열어주기 데모
// 이 서버를 Claude Code에 연결하면, 에이전트가 할 일과 날씨를 조회할 수 있습니다.

require("dotenv").config();
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");

const server = new McpServer({
  name: "callable-todo",
  version: "1.0.0",
});

// ─── 투두 데이터 ────────────────────────────────────────────
const todos = [
  { id: 1, text: "캠프 과제 제출하기", done: false },
  { id: 2, text: "점심 약속 — 성수동", done: false },
  { id: 3, text: "저녁 러닝 30분", done: false },
];

// ─── 날씨 가져오기 ──────────────────────────────────────────
async function getWeather(city) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return { error: "WEATHER_API_KEY 미설정" };
  }
  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&lang=ko`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) return { error: data.error.message };
  return {
    city: data.location.name,
    temp: Math.round(data.current.temp_c),
    description: data.current.condition.text,
  };
}

// ─── 날씨 기반 제안 ─────────────────────────────────────────
function suggestTodos(weather) {
  const suggestions = [];
  if (weather.description?.includes("비")) suggestions.push("우산 챙기기");
  if (weather.temp <= 0) suggestions.push("두꺼운 옷 준비하기");
  if (weather.temp >= 33) suggestions.push("물병 챙기기");
  return suggestions;
}

// ─── MCP 도구: 오늘의 할 일 + 날씨 조회 ────────────────────
server.tool(
  "get-today",
  "오늘의 할 일 목록과 날씨, 날씨 기반 제안을 반환합니다",
  { city: z.string().default("Seoul").describe("날씨를 조회할 도시") },
  async ({ city }) => {
    const weather = await getWeather(city);
    const suggestions = weather.error ? [] : suggestTodos(weather);

    const lines = [];
    lines.push(`📅 ${new Date().toLocaleDateString("ko-KR")}의 할 일`);
    lines.push("");
    todos.forEach((t) => {
      lines.push(`${t.done ? "✅" : "⬜"} ${t.text}`);
    });
    lines.push("");
    if (!weather.error) {
      lines.push(`🌤️ ${weather.city} 날씨: ${weather.temp}° ${weather.description}`);
    }
    if (suggestions.length > 0) {
      lines.push("");
      lines.push("💡 날씨 기반 제안:");
      suggestions.forEach((s) => lines.push(`  → ${s}`));
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ─── MCP 도구: 할 일 추가 ──────────────────────────────────
server.tool(
  "add-todo",
  "새로운 할 일을 추가합니다",
  { text: z.string().describe("추가할 할 일 내용") },
  async ({ text }) => {
    todos.push({ id: Date.now(), text, done: false });
    return { content: [{ type: "text", text: `✅ 추가됨: "${text}"` }] };
  }
);

// ─── 서버 시작 ──────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main();

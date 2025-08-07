import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function callGemini() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


  const result = await model.generateContent("AI 연결 테스트 중이야. 연결이 제대로 됐다면 '네'를 출력해줘.");
  const response = await result.response;
  const text = response.text();

  console.log("Gemini 응답:", text);
}

// ✅ 함수 호출 필요!
callGemini();

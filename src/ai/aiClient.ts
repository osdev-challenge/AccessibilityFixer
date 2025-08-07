// GPT API 요청 및 응답 처리

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODEL_NAME = "models/gemini-2.5-flash";  

export async function callGpt(prompt: string): Promise<string> {
  try {
    const model = geminiAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],

    });

    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('[callGpt] Gemini API 호출 중 오류 발생:', error);
    return 'Error: Gemini API 호출 실패';
  }
}



// (async () => {
//   const result = await callGpt("AI 연결 테스트 중이야. 연결이 제대로 됐다면 '네'를 출력해줘.");
//   console.log("Gemini 응답:", result);
// })();

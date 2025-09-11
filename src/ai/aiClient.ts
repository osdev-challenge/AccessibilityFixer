import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env 로드 시도 (없어도 에러를 던지지 않음)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function callGpt(prompt: string): Promise<string> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('❌ OPENAI_API_KEY가 .env에 설정되어 있지 않습니다.');
  }

  const response = await axios.post(
    OPENAI_API_URL,
    {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  const data = response.data;
  return data.choices[0].message.content;
}

// // 제미나이 API 요청 및 응답 처리

// import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
// import dotenv from 'dotenv';

// dotenv.config();

// const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// const MODEL_NAME = "models/gemini-2.5-flash";  

// export async function callGpt(prompt: string): Promise<string> {
//   try {
//     const model = geminiAI.getGenerativeModel({ model: MODEL_NAME });

//     const result = await model.generateContent({
//       contents: [{ role: 'user', parts: [{ text: prompt }] }],
//       generationConfig: {
//         temperature: 0.7,
//         maxOutputTokens: 1024,
//       },
//       safetySettings: [
//         { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
//         { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
//         { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
//         { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
//         ],

//     });

//     const response = result.response;
//     return response.text();
//   } catch (error) {
//     console.error('[callGpt] Gemini API 호출 중 오류 발생:', error);
//     return 'Error: Gemini API 호출 실패';
//   }
// }



// // (async () => {
// //   const result = await callGpt("AI 연결 테스트 중이야. 연결이 제대로 됐다면 '네'를 출력해줘.");
// //   console.log("Gemini 응답:", result);
// // })();

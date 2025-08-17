// src/ai/aiClient.ts
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
      model: 'gpt-3.5-turbo',
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
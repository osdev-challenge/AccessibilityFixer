import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fixAltText } from '../rules/ai/altText';

dotenv.config();

async function testFixAltText() {
  const inputPath = path.resolve(__dirname, 'sampleInput.jsx');
  const inputCode = fs.readFileSync(inputPath, 'utf-8');

  console.log('🧪 원본 코드:\n', inputCode);

  const fixedCode = await fixAltText(inputCode);

  console.log('\n✅ 수정된 코드:\n', fixedCode);
}

(async () => {
  try {
    await testFixAltText();
  } catch (e) {
    console.error('최상위 에러:', e);
  }
})();

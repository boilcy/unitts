import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(process.cwd(), '.env.test') });

export const testConfig = {
  MINIMAX_API_KEY: process.env['MINIMAX_API_KEY'] || '',
  MINIMAX_GROUP_ID: process.env['MINIMAX_GROUP_ID'] || '',
  OPENAI_API_KEY: process.env['OPENAI_API_KEY'] || '',
  ANTHROPIC_API_KEY: process.env['ANTHROPIC_API_KEY'] || '',
  GOOGLE_API_KEY: process.env['GOOGLE_API_KEY'] || '',
  TENCENT_APP_ID: process.env['TENCENT_APP_ID'] || '',
  TENCENT_SECRET_ID: process.env['TENCENT_SECRET_ID'] || '',
  TENCENT_SECRET_KEY: process.env['TENCENT_SECRET_KEY'] || '',
  ELEVENLABS_API_KEY: process.env['ELEVENLABS_API_KEY'] || '',
};

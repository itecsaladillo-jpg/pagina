import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const models = await genAI.listModels();
  for (const model of models) {
    console.log(model.name, model.supportedMethods);
  }
}

listModels().catch(console.error);

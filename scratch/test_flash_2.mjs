import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  const genAI = new GoogleGenerativeAI("AIzaSyB_eoiZZytzekWp3JJSBK7cfulqXwr-OHI");
  const modelList = await genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  console.log("Testing gemini-2.0-flash...");
  try {
    const result = await modelList.generateContent("ping");
    console.log("Success with gemini-2.0-flash:", result.response.text());
  } catch (e) {
    console.error("Failed with gemini-2.0-flash:", e.message);
  }
}

listModels().catch(console.error);

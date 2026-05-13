import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  const genAI = new GoogleGenerativeAI("AIzaSyB_eoiZZytzekWp3JJSBK7cfulqXwr-OHI");
  const modelList = await genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  console.log("Testing gemini-flash-latest...");
  try {
    const result = await modelList.generateContent("ping");
    console.log("Success with gemini-flash-latest:", result.response.text());
  } catch (e) {
    console.error("Failed with gemini-flash-latest:", e.message);
  }
}

listModels().catch(console.error);

import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  const genAI = new GoogleGenerativeAI("AIzaSyB_eoiZZytzekWp3JJSBK7cfulqXwr-OHI");
  const modelList = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  console.log("Testing gemini-1.5-flash...");
  try {
    const result = await modelList.generateContent("ping");
    console.log("Success with gemini-1.5-flash:", result.response.text());
  } catch (e) {
    console.error("Failed with gemini-1.5-flash:", e.message);
  }

  const modelList2 = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
  console.log("Testing gemini-1.5-flash-latest...");
  try {
    const result = await modelList2.generateContent("ping");
    console.log("Success with gemini-1.5-flash-latest:", result.response.text());
  } catch (e) {
    console.error("Failed with gemini-1.5-flash-latest:", e.message);
  }
}

listModels().catch(console.error);

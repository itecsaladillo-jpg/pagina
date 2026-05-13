import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  const genAI = new GoogleGenerativeAI("AIzaSyB_eoiZZytzekWp3JJSBK7cfulqXwr-OHI");
  
  const modelList3 = await genAI.getGenerativeModel({ model: 'gemini-pro' });
  console.log("Testing gemini-pro...");
  try {
    const result = await modelList3.generateContent("ping");
    console.log("Success with gemini-pro:", result.response.text());
  } catch (e) {
    console.error("Failed with gemini-pro:", e.message);
  }
}

listModels().catch(console.error);

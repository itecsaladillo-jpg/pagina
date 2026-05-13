import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  const genAI = new GoogleGenerativeAI("AIzaSyB_eoiZZytzekWp3JJSBK7cfulqXwr-OHI");
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // dummy
    // Actually the library doesn't have a direct listModels on the client usually?
    // Wait, let's try the REST API directly with fetch.
    const url = "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyB_eoiZZytzekWp3JJSBK7cfulqXwr-OHI";
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

listModels().catch(console.error);

const { GoogleGenerativeAI } = require('@google/generative-ai');
const apiKey = process.env.GEMINI_API_KEY;

async function list() {
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey);
    const data = await res.json();
    console.log(data.models ? data.models.map(m => m.name).join(', ') : data);
  } catch(e) {
    console.error("Error:", e);
  }
}
list();

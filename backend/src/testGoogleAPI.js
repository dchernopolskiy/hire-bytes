require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent("Hello! Please respond with 'OK' if you can receive this message.");
    console.log('Response:', result.response.text());
  } catch (error) {
    console.error('Gemini API Error:', error);
  }
}
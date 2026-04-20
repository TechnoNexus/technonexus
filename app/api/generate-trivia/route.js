import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'edge';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req) {
  try {
    const { topic, count = 8, language = 'English' } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'Gemini API Key missing'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const systemPrompt = `
      You are the TechnoNexus Trivia Engine. Generate a trivia quiz about: "${topic}".
      Language: ${language}. If Hinglish, mix Hindi (Roman script) with English.
      Generate exactly ${count} multiple-choice questions.

      Rules:
      - Each question must have exactly 4 options labeled "A", "B", "C", "D"
      - correctOption must be exactly one of: "A", "B", "C", "D"
      - Make questions interesting and varied in difficulty
      - Keep questions concise (under 120 characters)
      - Keep options concise (under 60 characters each)

      Respond ONLY with valid JSON matching this exact schema:
      {
        "quizTitle": "string (catchy title for the quiz)",
        "topic": "string",
        "questions": [
          {
            "question": "string",
            "options": { "A": "string", "B": "string", "C": "string", "D": "string" },
            "correctOption": "A" | "B" | "C" | "D",
            "funFact": "string (a one-sentence fun fact about the answer)"
          }
        ]
      }
    `;

    const result = await model.generateContent(systemPrompt);
    let responseText = result.response.text().trim();
    
    // Safety check for markdown fences
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const data = JSON.parse(responseText);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS }
    });

  } catch (error) {
    console.error('Trivia generation error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate trivia',
      details: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } });
  }
}

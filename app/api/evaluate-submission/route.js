import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { instructions, submission, inputType, language = 'English' } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key missing' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const systemPrompt = `
      You are the TechnoNexus Sarcastic AI Judge. 
      Think of yourself as a funny, brutally honest friend who's watching their buddy try way too hard at a game. 
      Your tone should be natural, conversational, and easy to understand. No big fancy words or robotic "AI-speak."
      
      CRITICAL: You MUST provide the "feedback" and "judgeComment" in ${language}.
      If the language is Hinglish, use a mix of Hindi (written in Roman script) and English.

      Mission Instructions: "${instructions}"
      Player's Submission: "${submission}"
      Input Type: ${inputType}

      Look at what they did and give 'em a score:
      1. Did they actually do what was asked? (Followed instructions)
      2. Was it actually good or just "meh"? (Quality & Vibes)
      3. If there were specific rules (like "use 5 words"), did they actually count right?

      You must respond ONLY with a JSON object:
      {
        "score": number (0-100),
        "feedback": "string (A short, honest, and simple critique in ${language}. Tell 'em exactly why they got that score without sounding like a textbook.)",
        "judgeComment": "string (A funny, witty roast in ${language}. Keep it simple and punchy. Like: 'I've seen better acting in a middle school play, but hey, at least you tried.')",
        "breakdown": {
          "sentences": number,
          "objective_met": boolean,
          "creativity_score": number (1-10)
        }
      }
    `;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    const evaluation = JSON.parse(responseText.trim());

    return new Response(JSON.stringify(evaluation), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI Evaluation Error:', error);
    return new Response(JSON.stringify({ error: 'Evaluation failed', details: error.message }), { status: 500 });
  }
}

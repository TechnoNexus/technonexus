import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { prompt, language = 'English' } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // 1. Check for API Key
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Gemini API Key missing', 
        details: 'Please add GOOGLE_GENERATIVE_AI_API_KEY to your Cloudflare Environment Variables.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Initialize the Gemini SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 3. Configure the Model (Forcing strict JSON Output)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: {
        responseMimeType: "application/json", 
      }
    });

    // 4. Craft the System Prompt
    const systemPrompt = `
      You are the TechnoNexus Game Engine (Gemini 2.5 Flash). 
      The host has provided the following custom game idea or instruction: "${prompt}".
      
      CRITICAL: You must generate all instructions, titles, and content in ${language}.
      If the language is Hinglish, use a mix of Hindi (written in Roman script) and English.
      
      You must design a quick, fun party game based on this idea. 
      Decide the best "gameType" based on the prompt:
      - 'performance': For Charades, Acting, or Pictionary. Provide a list of items to act out in 'gameContent'.
      - 'text': For Creative Writing, Poetry, or Storytelling. Players type their response.
      - 'quiz': For Trivia or Facts. Provide questions and answers in 'gameContent'.

      You must respond ONLY with a valid JSON object matching this exact schema:
      {
        "gameTitle": "string (A catchy title for the game in ${language})",
        "instructions": "string (Clear, punchy rules for the players in ${language})",
        "timeLimitSeconds": number (between 30 and 120),
        "gameType": "string ('text', 'performance', or 'quiz')",
        "inputType": "string ('text', 'voice', or 'none')",
        "gameContent": "any (If 'performance', an Array of strings to act out. If 'quiz', an Array of objects with question/answer. If 'text', leave as null.)"
      }

      Example for 'Baby Items Charades':
      {
        "gameTitle": "Nursery Nightmares",
        "gameType": "performance",
        "inputType": "none",
        "gameContent": ["Diaper Change", "Baby Bottle", "Pacifier", "Stroller", "Crying Baby"],
        "timeLimitSeconds": 60,
        "instructions": "One player acts out the baby item. The rest guess! No talking!"
      }
    `;

    // 5. Generate the Game Payload
    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    // 6. Parse and Return
    // Since we forced application/json, we can safely parse it directly
    const gameData = JSON.parse(responseText.trim());

    return new Response(JSON.stringify(gameData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    return new Response(JSON.stringify({ 
      error: 'AI Forge failed to generate game', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
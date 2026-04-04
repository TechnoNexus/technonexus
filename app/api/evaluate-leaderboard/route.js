import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { players, missionTitle, language = 'English' } = await req.json();
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
      The mission "${missionTitle}" has just concluded.
      
      CRITICAL: You MUST provide all summary and verdicts in ${language}.
      If the language is Hinglish, use a mix of Hindi (written in Roman script) and English.

      Here are the player scores:
      ${JSON.stringify(players, null, 2)}

      Review the results and provide a witty, sarcastic summary of the round in ${language}.
      Identify a "Nexus MVP" (highest score) and a "Legacy Bottleneck" (lowest score).
      
      Respond ONLY with a JSON object:
      {
        "roundSummary": "string (A sharp, funny summary of how the room performed as a whole in ${language})",
        "mvpVerdict": "string (A comment for the winner in ${language})",
        "bottleneckVerdict": "string (A sarcastic 'roast' for the person who came last in ${language})"
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
    console.error('Leaderboard AI Error:', error);
    return new Response(JSON.stringify({ error: 'Leaderboard evaluation failed' }), { status: 500 });
  }
}

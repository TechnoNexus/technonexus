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

    const systemPrompt = `You are the TechnoNexus Sarcastic AI Judge. The mission ${JSON.stringify(missionTitle)} has just concluded. Respond in ${language}. For Hinglish, mix Hindi (Roman script) with English.

Player scores:
${JSON.stringify(players, null, 2)}

Provide a witty, sarcastic summary of the round. Identify the highest scorer (MVP) and lowest scorer (bottleneck).

RESPOND ONLY WITH VALID JSON (no extra text):
{
  "roundSummary": "<funny summary of the room's performance in ${language}>",
  "mvpVerdict": "<comment for the winner in ${language}>",
  "bottleneckVerdict": "<sarcastic roast for last place in ${language}>"
}`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response: ' + responseText);
    }
    
    const evaluation = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(evaluation), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS }
    });

  } catch (error) {
    console.error('Leaderboard AI Error:', error);
    return new Response(JSON.stringify({ error: 'Leaderboard evaluation failed', details: error.message }), { status: 500, headers: CORS });
  }
}

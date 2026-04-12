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
    const { instructions, submissions, inputType, language = 'English' } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key missing' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    // Build prompt more safely with proper JSON escaping
    const systemPrompt = `You are the TechnoNexus Sarcastic AI Judge. You are judging a group of friends. Be funny, natural, and conversational. Respond in ${language}. For Hinglish, mix Hindi (Roman script) with English.

Instructions: ${JSON.stringify(instructions)}
Input Type: ${inputType}

Player Submissions:
${JSON.stringify(submissions, null, 2)}

For each player, provide a score (0-100) and a witty comment in ${language}.

RESPOND ONLY WITH VALID JSON (no extra text):
{
  "results": [
    {
      "name": "<player name>",
      "score": <number 0-100>,
      "judgeComment": "<funny, simple roast in ${language}>"
    }
  ]
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
    console.error('Batch Evaluation Error:', error);
    return new Response(JSON.stringify({ error: 'Batch evaluation failed', details: error.message }), { status: 500, headers: CORS });
  }
}

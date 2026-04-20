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
    const { instructions, submissions, inputType, language = 'English', gameType, letter } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key missing' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    let systemPrompt = "";

    if (gameType === 'npatm') {
      systemPrompt = `You are the TechnoNexus Sarcastic AI Judge. 
Game: Name Place Animal Thing Movie (NPATM). 
Round Letter: "${letter}"
Language: English (Bollywood movies allowed).

SCORING RULES:
1. Valid Entry: +10 points. Must be correctly spelled, start with letter "${letter}", and fit the category.
2. Duplicate Check: I have provided a list of all player submissions. IF TWO OR MORE PLAYERS HAVE WRITTEN THE EXACT SAME WORD FOR A CATEGORY, BOTH PLAYERS GET 0 POINTS FOR THAT CATEGORY.
3. Bollywood: Bollywood movies are allowed even if the game is in English.

Player Submissions:
${JSON.stringify(submissions, null, 2)}

For each player, calculate their score (Max 50: 10 per category). For each category, provide the submitted word and a brief status in brackets (e.g., "Apple [Valid]", "Banana [Duplicate]", or "None [Invalid]"). Add a witty roast in English.

RESPOND ONLY WITH VALID JSON:
{
  "results": [
    {
      "name": "<player name>",
      "score": <0-50>,
      "details": { "name": "word [Status]", "place": "word [Status]", "animal": "word [Status]", "thing": "word [Status]", "movie": "word [Status]" },
      "judgeComment": "<sarcastic remark>"
    }
  ]
}`;
    } else {
      // Build standard prompt
      systemPrompt = `You are the TechnoNexus Sarcastic AI Judge. You are judging a group of friends. Be funny, natural, and conversational. Respond in ${language}. For Hinglish, mix Hindi (Roman script) with English.

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
}
`;
    }

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

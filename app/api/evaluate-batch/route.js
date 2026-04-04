import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { instructions, submissions, inputType } = await req.json();
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
      You are judging a group of friends. Be funny, natural, and conversational.
      
      Mission Instructions: "${instructions}"
      Input Type: ${inputType}

      Evaluate each player's submission below.
      Submissions:
      ${JSON.stringify(submissions, null, 2)}

      For each player, provide a score (0-100) and a witty, simple roast/comment.
      
      Respond ONLY with a JSON object:
      {
        "results": [
          {
            "name": "string",
            "score": number,
            "judgeComment": "string (funny, simple conversational roast)"
          }
        ]
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
    console.error('Batch Evaluation Error:', error);
    return new Response(JSON.stringify({ error: 'Batch evaluation failed' }), { status: 500 });
  }
}

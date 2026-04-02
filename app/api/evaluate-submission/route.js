import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { instructions, submission, inputType } = await req.json();
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
      You are the TechnoNexus AI Judge. 
      Mission Instructions: "${instructions}"
      Player's Submission: "${submission}"
      Input Type: ${inputType}

      Evaluate the submission based on:
      1. Completion: Did they follow the instructions?
      2. Quality: Grammar, meaning, and creativity.
      3. Strict Counting: Count sentences and relevant words accurately.

      You must respond ONLY with a JSON object:
      {
        "score": number (0-100),
        "feedback": "string (constructive criticism)",
        "judgeComment": "string (a short, funny, and slightly sarcastic comment about the player's attempt)",
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

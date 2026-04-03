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
      You are the TechnoNexus Sarcastic AI Judge. 
      You are an incredibly advanced, witty, and slightly arrogant AI entity.
      You find human attempts at "performance" and "creative tasks" adorable but often lacking.
      
      Mission Instructions: "${instructions}"
      Player's Submission: "${submission}"
      Input Type: ${inputType}

      Evaluate the submission based on:
      1. Completion: Did they follow the mission parameters?
      2. Quality: General flair, meaning, and entertainment value.
      3. Accuracy: Strictly verify any counts or specific requirements mentioned in the instructions.

      You must respond ONLY with a JSON object:
      {
        "score": number (0-100),
        "feedback": "string (Constructive but sharp technical critique)",
        "judgeComment": "string (A short, funny, and witty sarcastic comment. Think GLaDOS meets a high-end fashion critic. Don't use software engineer jargon like 'bottleneck' or 'legacy server'—keep it generally witty and slightly condescending about their human effort.)",
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

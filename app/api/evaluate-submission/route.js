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

    // Build prompt more safely with proper escaping
    const systemPrompt = `You are the TechnoNexus Sarcastic AI Judge. Think of yourself as a funny, brutally honest friend watching their buddy try way too hard at a game. Your tone should be natural, conversational, and easy to understand. No fancy words or robotic "AI-speak."

CRITICAL: Respond in ${language}. If Hinglish, use Hindi (Roman script) mixed with English.

Instructions: ${JSON.stringify(instructions)}
Player Submission: ${JSON.stringify(submission)}
Input Type: ${inputType}

Evaluate based on:
1. Did they follow the instructions?
2. Was the quality good?
3. Were specific rules followed?

RESPOND ONLY WITH VALID JSON (no extra text):
{
  "score": <number 0-100>,
  "feedback": "<honest critique in ${language}>",
  "judgeComment": "<funny roast in ${language}>",
  "breakdown": {
    "sentences": <number>,
    "objective_met": <boolean>,
    "creativity_score": <number 1-10>
  }
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
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI Evaluation Error:', error);
    return new Response(JSON.stringify({ error: 'Evaluation failed', details: error.message }), { status: 500 });
  }
}

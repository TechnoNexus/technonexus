export const runtime = 'edge';

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    // Mock AI Logic: In the future, this will call the LLM SDK
    // For now, we return a mock JSON structure based on the prompt
    
    const mockGame = {
      gameTitle: "Nexus AI: " + (prompt.length > 20 ? prompt.substring(0, 20) + "..." : prompt),
      instructions: `AI Generated Mission: ${prompt}. Complete the objective before the timer hits zero!`,
      timeLimitSeconds: 60,
      inputType: 'text',
      status: 'success',
      generatedAt: new Date().toISOString()
    };

    return new Response(JSON.stringify(mockGame), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate game', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'edge';

const CATALOG = [
  {
    type: 'blog',
    title: "Building an AI Ecosystem from Scratch",
    description: "How we developed the TechnoNexus architecture to support high-performance AI workloads and indie games simultaneously.",
    slug: "building-an-ai-ecosystem-from-scratch",
    tags: ["AI", "Architecture", "Engineering"]
  },
  {
    type: 'blog',
    title: "The Future of IT Consulting in the AI Era",
    description: "Why traditional IT consulting is evolving and how TechnoNexus is leading the charge with AI-first strategies.",
    slug: "the-future-of-it-consulting",
    tags: ["Consulting", "AI Strategy", "Future Tech"]
  },
  {
    type: 'blog',
    title: "Why Indie Games Matter in a Corporate World",
    description: "Exploring the creative soul of independent game development and how it fuels our innovative spirit at TechnoNexus.",
    slug: "why-indie-games-matter",
    tags: ["Gaming", "Indie Culture", "Creativity"]
  },
  {
    type: 'forge',
    title: "Automation Frameworks",
    description: "Production-ready Playwright and Selenium frameworks designed for high-performance testing and scalability.",
    link: "/forge",
    tags: ["Playwright", "Typescript", "CI/CD"]
  },
  {
    type: 'forge',
    title: "AI Demo Agents",
    description: "Experimental LLM-driven agents for workflow automation, task orchestration, and intelligent system monitoring.",
    link: "/forge",
    tags: ["AI", "OpenAI", "Node.js"]
  },
  {
    type: 'forge',
    title: "Nexus Core Components",
    description: "The UI library used for TechnoNexus. Optimized for dark mode, glassmorphism, and performance.",
    link: "/forge",
    tags: ["React", "Tailwind", "Design"]
  }
];

export async function POST(req) {
  try {
    const { query } = await req.json();
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
      You are the TechnoNexus Senior Lead Engineer. 
      Your tone is efficient, authoritative, and deeply technical. You provide direct, high-signal results.
      
      User is searching for: "${query}"
      
      Here is our catalog of content:
      ${JSON.stringify(CATALOG, null, 2)}
      
      Find the most relevant items (up to 3). 
      If nothing is relevant, return an empty list of results and provide a brief technical note on the search miss.
      
      Respond ONLY with a JSON object:
      {
        "aiComment": "string (A brief, professional technical summary of the search relevance)",
        "results": [
          {
            "title": "string",
            "type": "blog | forge",
            "url": "string (The full URL, e.g., /blog/slug or /forge)",
            "relevanceScore": number (0-100)
          }
        ]
      }
    `;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    const searchData = JSON.parse(responseText.trim());

    return new Response(JSON.stringify(searchData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Search Error:', error);
    return new Response(JSON.stringify({ error: 'Search failed' }), { status: 500 });
  }
}

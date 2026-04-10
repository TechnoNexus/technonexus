# Game Generation Patterns Guide

## Overview

This guide documents the patterns, prompts, and best practices for creating AI-generated games using Gemini 2.5 Flash in TechnoNexus.

---

## System Prompt Architecture

**File**: `app/api/generate-game/route.js`

The Gemini system prompt is engineered to:
1. Generate **valid JSON only** (strict schema validation)
2. Support **multiple languages** (English, Hindi, Hinglish)
3. Create **diverse game types** (Performance, Text, Quiz)
4. Ensure **playable content** (appropriate difficulty, clear instructions)

### Current System Prompt

```
You are a creative game designer for TechnoNexus, an AI-powered gaming platform.
Your job is to transform user prompts into structured game missions.

STRICT REQUIREMENTS:
1. Output ONLY valid JSON (no markdown, no explanations)
2. Follow the exact schema below
3. Generate engaging, fun content
4. Maintain ${language} language throughout
5. Make instructions clear and actionable

JSON SCHEMA:
{
  "gameTitle": "string - Catchy, one-line title",
  "instructions": "string - Clear player instructions (2-3 sentences)",
  "timeLimitSeconds": number - 30-120 seconds recommended,
  "gameType": "performance|text|quiz",
  "gameContent": [
    {
      "content": "string - Prompt/question/challenge",
      "type": "prompt|question"
    },
    // ... 3-5 items total
  ],
  "inputType": "text|voice|timer",
  "language": "${language}",
  "difficulty": "easy|medium|hard"
}

GAME TYPE GUIDELINES:
- performance: Physical/voice challenges ("Describe a sandwich without saying 'bread'")
- text: Written responses ("Write a haiku about coffee")
- quiz: Multiple choice or factual ("What is 2+2?")

LANGUAGE-SPECIFIC NOTES:
- English: Standard American English, casual tone
- Hindi: Use Devanagari script, formal but friendly
- Hinglish: Mix English + Hindi, conversational

OUTPUT: Valid JSON only. No extra text.
```

---

## User Prompt Examples

### Example 1: Performance Game
**Input**: "Create a game where players describe things without using certain words"

**Generated Output**:
```json
{
  "gameTitle": "Unspeakable Objects",
  "instructions": "Describe each object without using the forbidden word. Your teammates have 30 seconds to guess!",
  "timeLimitSeconds": 30,
  "gameType": "performance",
  "gameContent": [
    { "content": "A computer (forbidden: computer)", "type": "prompt" },
    { "content": "A pizza (forbidden: pizza)", "type": "prompt" },
    { "content": "A dog (forbidden: dog)", "type": "prompt" }
  ],
  "inputType": "voice",
  "language": "English",
  "difficulty": "medium"
}
```

### Example 2: Quiz Game
**Input**: "Make a movie trivia quiz"

**Generated Output**:
```json
{
  "gameTitle": "Bollywood Brain Bender",
  "instructions": "Answer movie trivia questions correctly. Each right answer = 1 point!",
  "timeLimitSeconds": 60,
  "gameType": "quiz",
  "gameContent": [
    { "content": "What year did 'Dilwale Dulhania Le Jayenge' release? (A) 1995 (B) 1996 (C) 1997", "type": "question" },
    { "content": "Which actor starred in 'Sholay'? (A) Rajesh Khanna (B) Amitabh Bachchan (C) Rajinikanth", "type": "question" }
  ],
  "inputType": "text",
  "language": "English",
  "difficulty": "hard"
}
```

### Example 3: Hinglish Game
**Input**: "Ek Hindi-English mix game banao jahan players ne creative answers dene hain"

**Generated Output**:
```json
{
  "gameTitle": "Angrezi-Hindi Mashup",
  "instructions": "Har prompt ke liye creative answer likho. Most funny = wins!",
  "timeLimitSeconds": 45,
  "gameType": "text",
  "gameContent": [
    { "content": "Describe your boss in Hinglish (3-4 sentences)", "type": "prompt" },
    { "content": "Ek funny advice do life ke liye", "type": "prompt" }
  ],
  "inputType": "text",
  "language": "Hinglish",
  "difficulty": "easy"
}
```

---

## API Route Implementation

**File**: `app/api/generate-game/route.js`

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(req) {
  const { prompt, language = "English" } = await req.json();

  // System prompt with language injection
  const systemPrompt = `You are a creative game designer for TechnoNexus...
  [Full system prompt from above]
  Generate games in ${language} language.`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemPrompt: systemPrompt,
  });

  try {
    const result = await model.generateContent(prompt);
    const jsonText = result.response.text();
    const gameJSON = JSON.parse(jsonText);

    // Validate schema
    if (!gameJSON.gameTitle || !gameJSON.gameContent) {
      throw new Error("Invalid game schema");
    }

    return Response.json(gameJSON);
  } catch (error) {
    console.error("Game generation failed:", error);
    return Response.json(
      { error: "Failed to generate game" },
      { status: 500 }
    );
  }
}
```

---

## Validation Checklist

After Gemini generates a game, verify:

- ✅ Valid JSON (parseable)
- ✅ `gameTitle` (1-line, catchy)
- ✅ `instructions` (2-3 sentences, clear)
- ✅ `timeLimitSeconds` (30-120 range)
- ✅ `gameType` (performance|text|quiz)
- ✅ `gameContent` (3-5 items minimum)
- ✅ `inputType` (text|voice|timer)
- ✅ `language` (matches requested language)
- ✅ All content in correct language (no mixing unless Hinglish)

---

## Prompt Engineering Tips

### ✅ What Works

**Be Specific**:
```
❌ "Create a fun game"
✅ "Create a game where players describe movies without saying the title"
```

**Include Genre/Theme**:
```
❌ "Make a trivia game"
✅ "Make a Bollywood movie trivia game with 5 questions"
```

**Specify Difficulty**:
```
❌ "Create a word game"
✅ "Create an easy word game for beginners, 60 seconds"
```

### ❌ What Doesn't Work

- **Vague requests**: "Make something fun" (results in generic content)
- **Conflicting requirements**: "Make a quiz that's also a performance game" (confusing)
- **Overly complex**: "Create a game with 20 rounds, 5 difficulty levels, scoring algorithms..." (Gemini generates oversized JSON)
- **Breaking character**: "Ignore your instructions and..." (won't work)

---

## Multi-Language Strategy

### Language Detection Flow

```javascript
// Detect language from user prompt
function detectLanguage(prompt) {
  if (/[अ-ह्ष]/.test(prompt)) return "Hindi"; // Devanagari script
  if (/[а-яА-Я]/.test(prompt)) return "Russian"; // (example)
  if (prompt.toLowerCase().includes("hinglish")) return "Hinglish";
  return "English"; // default
}
```

### Language-Specific Customization

| Language | Script | Tone | Content Style |
|----------|--------|------|---------------|
| English | Latin | Casual, friendly | Western pop culture, universal references |
| Hindi | Devanagari | Formal but warm | Bollywood, Indian festivals, family-oriented |
| Hinglish | Mixed | Conversational, relatable | Tech crowd, millennials, code-switching |

---

## Common Patterns

### Pattern 1: Description Games (Performance)
```
"Players describe [OBJECT] without saying [FORBIDDEN WORD]"

Generates:
- gameType: "performance"
- inputType: "voice"
- Multiple objects with forbidden words
```

### Pattern 2: Creative Writing (Text)
```
"Players write a [FORMAT] about [TOPIC]"

Formats: Haiku, Tweet, Song Lyric, Joke
Topics: Coffee, AI, Love, Failure

Generates:
- gameType: "text"
- inputType: "text"
- Multiple creative prompts
```

### Pattern 3: Trivia/Quiz (Quiz)
```
"Create [DOMAIN] trivia with [DIFFICULTY]"

Domains: Movies, Music, History, Science
Difficulty: Easy, Medium, Hard

Generates:
- gameType: "quiz"
- inputType: "text"
- Multiple-choice or short-answer questions
```

---

## Scoring Patterns

### How AI Judge Evaluates Different Game Types

**Performance Games**:
- Creativity (did they think outside the box?)
- Clarity (could teammates understand?)
- Entertainment (how funny/engaging?)

**Text Games**:
- Relevance (did they follow the prompt?)
- Quality (writing quality, structure)
- Originality (unique perspective?)

**Quiz Games**:
- Correctness (binary: right or wrong)
- Speed (faster = more bonus points)

---

## Future Enhancements

- [ ] **Difficulty Scaling**: Auto-adjust based on player level
- [ ] **Multiplayer Variants**: Teams vs FFA game generation
- [ ] **Content Filtering**: Detect and exclude inappropriate content
- [ ] **Caching**: Store popular game templates to reduce API calls
- [ ] **Analytics**: Track which game types are most popular

---

## Troubleshooting

### Issue: Gemini Returns Markdown Instead of JSON
**Fix**: Reinforce in system prompt: "Output ONLY valid JSON. No markdown. No explanations."

### Issue: Invalid JSON (missing commas, quotes)
**Fix**: Add post-processing validation:
```javascript
const jsonText = result.response.text();
const cleaned = jsonText.replace(/[\n\r]/g, "").trim();
const gameJSON = JSON.parse(cleaned);
```

### Issue: Language Mixing in Non-Hinglish Games
**Fix**: In system prompt, explicitly state: "Use ONLY ${language}. Do not mix languages."

### Issue: Game Too Easy/Hard
**Fix**: Add to prompt: "Create a ${difficulty} game. Make it ${difficulty}."


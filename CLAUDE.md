# Claude Code Instructions — TechnoNexus

You are working on **TechnoNexus**: a Next.js 16 gaming and IT-consulting platform combining AI game generation, real-time multiplayer, enterprise consulting content, and a mobile app (Capacitor).

---

## 1. Read Before Touching Anything

These three docs encode weeks of production debugging. Read the relevant one before editing:

- `.github/docs/technonexus-architecture.md` — project structure, file map, core patterns
- `.github/docs/multiplayer-sync-guide.md` — PeerJS lifecycle, why guests freeze, connection timing
- `.github/docs/game-generation-patterns.md` — Gemini prompt schemas, game types, multi-language

---

## 2. Tech Stack (exact versions, don't upgrade without asking)

| Layer | Tech |
|-------|------|
| Framework | Next.js 16.2.1 (App Router) + React 19 |
| Styling | Tailwind CSS 3.x only — no CSS-in-JS, no inline styles |
| State | Zustand 5.x (games), React hooks (UI components) |
| AI | Google Gemini 2.5 Flash — **hardcoded, never change the model** |
| Database | Supabase (Auth + PostgreSQL) |
| Multiplayer | PeerJS (decentralized P2P, no dedicated server) |
| Mobile | Capacitor 8.x (iOS + Android native wrapper) |
| Deployment | Cloudflare Pages with Edge Runtime |
| Language | JavaScript (.js) only — no TypeScript files |

---

## 3. Visual Identity — Non-Negotiable

- **Background:** `#0A0A0A` (dark-bg)
- **Primary accent:** `#00FFFF` neon-cyan
- **Secondary accent:** `#8B5CF6` electric-violet / neon-violet
- **Style:** glassmorphism (`glass-panel` class), neon glows on hover, `rounded-[2rem]` panels
- **Typography:** `font-black tracking-tighter uppercase` for section headings
- **Hub names:** always `<span className="gradient-text-cyan">NEXUS</span> ARCADE` etc.
- **Font:** Geist Sans via `var(--font-geist-sans)` — never swap it

Do not add new color variables or override the theme.

---

## 4. Critical Rules — Production-Hardened

### Never break these:

**NexusRoomManager must always be mounted**
- `<NexusRoomManager />` renders at the bottom of `ai-forge/page.js`, outside all conditionals
- Moving it inside a conditional unmounts it → effects stop → guests see frozen UI
- See: `app/games/ai-forge/page.js` bottom

**PeerJS connections register AFTER join message**
- The `'connection'` event fires before the data channel opens (`conn.open = 0`)
- Only add to `connections.current` pool after receiving the guest's `'join'` message
- See: `components/NexusRoomManager.js` ~line 230

**State broadcasts are atomic**
- Never send `roomStatus`, `customGame`, `gameMode` as separate PeerJS messages
- Combine into one `type: 'start-game'` message
- Out-of-order messages corrupt guest state

**No retry loops**
- A 2-second retry loop calling `setCustomGame()` causes re-renders that clear guest text input
- Use the two-layer effect pattern: MONITOR detects state change → increments counter → USE effect broadcasts once

**Always filter connections before sending**
```js
connections.current.filter(c => c.open).forEach(conn => {
  try { conn.send(data); } catch(e) {}
});
```

### Gemini rules:
- Model is always `"gemini-2.5-flash"` — hardcoded everywhere, never change
- All player evaluations go through `/api/evaluate-batch` — never call individual evaluation per player
- Prompts must end with "RESPOND ONLY WITH VALID JSON" — no markdown fences in output

---

## 5. Project Structure

```
app/
  api/           — Edge API routes (generate-game, evaluate-batch, evaluate-leaderboard, evaluate-submission, generate-trivia, nexus-search)
  games/         — ai-forge, dumb-charades, team-picker, nexus-blitz
  apps/          — random-generator, dev-utility
  blog/          — markdown posts + [slug] dynamic route
  leaderboard/   — local win-tracking page
  forge/         — GitHub open-source showcase
components/
  NexusRoomManager.js  — ALL multiplayer orchestration (PeerJS + Gemini calls)
  NativeGatekeeper.js  — Capacitor native detection, adds .is-native-app to body
  CapacitorAppCheck.js — Status bar, splash screen, Android back button
  navbar/
    index.js          — Web navbar (hidden on native via Capacitor.isNativePlatform())
    BottomTabNav.js   — Mobile-only fixed bottom nav with haptics
lib/
  api.js          — getApiUrl() and getWebUrl() for native/web URL switching
  supabase.js     — Supabase client
  capacitor-storage.js — Offline vault via Capacitor Preferences
  native-hardware.js   — Camera hook placeholder
store/
  gameStore.js    — Zustand store (leaderboard persisted to localStorage)
docs/
  roadmap.md      — ALWAYS update after changes (hard rule from all agents)
  supabase-schema.sql — Full schema reference
  SECURITY.md     — RLS policies reference
```

---

## 6. Supabase — What Actually Exists

| Table | Status | Notes |
|-------|--------|-------|
| `user_games` | ✅ Exists and working | Vault save/load/delete/rename all functional |
| `user_profiles` | ❌ Not yet created | Schema in docs/supabase-schema.sql |
| `leaderboard` | ❌ Not yet created | Schema in docs/supabase-schema.sql |
| `game_sessions` | ❌ Not yet created | Schema in docs/supabase-schema.sql |
| RLS on user_games | ❌ Not yet applied | SQL in docs/SECURITY.md |

**Supabase client** is in `lib/supabase.js`. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 7. Mobile App Architecture

The Capacitor app uses `webDir: "out"` to serve **bundled local assets** (not the live URL).

**Build commands:**
```bash
npm run build:mobile    # static export to out/
npm run cap:android     # build:mobile + sync + open Android Studio
npm run cap:ios         # build:mobile + sync + open Xcode
```

**How native/web URL routing works:**
- `lib/api.js` exports `getApiUrl(path)` — returns absolute `https://technonexus.ca/api/...` on native, relative `/api/...` on web
- `lib/api.js` exports `getWebUrl(path)` — always returns public HTTPS URL (used for QR code join links)
- All 6 API routes have CORS headers (`Access-Control-Allow-Origin: *`) for native WebView requests

**Native detection:** `Capacitor.isNativePlatform()` — returns true in the app, false on web

**On native app:**
- `.is-native-app` class is added to `document.body`
- Web `<Navbar>` is hidden (returns null)
- `<Footer>` is hidden via CSS
- `<BottomTabNav>` shows with haptics + neon pill indicator
- Android back button navigates or exits via `@capacitor/app`

---

## 8. Games Library

| Game | Route | Status | Notes |
|------|-------|--------|-------|
| Nexus AI Forge | `/games/ai-forge` | ✅ Full | Supabase vault, PeerJS rooms, Gemini scoring |
| Dumb Charades | `/games/dumb-charades` | ✅ Full | PeerJS rooms, local word database |
| Team Picker | `/games/team-picker` | ✅ Full | Offline, no AI needed |
| Nexus Blitz | `/games/nexus-blitz` | ✅ Full | Solo AI trivia, Gemini MCQ, 15s timer |
| Neon Runner | `/games/neon-runner` | ❌ Not built | Listed as IN DEVELOPMENT |

---

## 9. Workflow Rules

1. **Read the file before editing it** — never assume what's inside
2. **Surgical edits only** — use Edit tool to change specific lines; use Write only for new files
3. **Update `docs/roadmap.md`** after every change — all agents enforce this rule
4. **Test the golden path** before declaring done
5. **Don't add abstractions** unless something is used 3+ times
6. **Don't add TypeScript** — this is a .js-only project by design
7. **Don't change the Gemini model** — `gemini-2.5-flash` is non-negotiable
8. **Ask before touching multiplayer code** — the PeerJS patterns are fragile and well-documented

---

## 10. Multi-Agent Context

Three agents work on this repo. Their context files:
- **Claude Code** → `CLAUDE.md` (this file)
- **Gemini** → `GEMINI.md`
- **GitHub Copilot** → `copilot-instructions.md`
- **Architect agent** → `.github/agents/technonexus-architect.agent.md`

All agents share the same rules. When Claude makes changes, update `docs/roadmap.md` so other agents stay in sync.

---

## 11. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL         — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY    — Supabase anon key (safe to expose)
GOOGLE_GENERATIVE_AI_API_KEY     — Gemini API key (server-side only, never expose to client)
```

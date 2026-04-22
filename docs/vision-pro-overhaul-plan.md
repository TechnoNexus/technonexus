# TechnoNexus: Ultra High Definition Overhaul Plan

## 1. Core Philosophy & Aesthetic
We are upgrading TechnoNexus from its current "retro indie" aesthetic to a premium, "Spatial Computing" (Apple Vision Pro style) environment. The goal is to create an "out of this world," highly dynamic, and immersive ecosystem.

**Key Visual Characteristics:**
- **Refined Glassmorphism:** Moving beyond flat transparency to true frosted glass with edge lighting, subtle noise textures, and deep backdrop blurs.
- **Sophisticated Depth:** Utilizing physical shadows, layered Z-indexes, and subtle parallax to create a sense of tangible space.
- **Fluid Micro-interactions:** Every hover, click, and state change will be animated smoothly with spring physics (no abrupt changes).
- **High-End Typography & Spacing:** Perfecting the usage of Geist Sans with generous breathing room and sharp contrast.
- **Immersive 3D Accents:** Introducing interactive 3D elements (e.g., a rotating crystalline Nexus core) to elevate the platform to "ultra high definition."

## 2. Technological Expansion
We are officially overriding the legacy constraints ("Tailwind only", "no new dependencies"). The new stack will integrate:

1.  **Framer Motion:** The foundation for all 2D animations, page transitions, layout morphing, and physics-based interactions.
2.  **React Three Fiber (R3F) & Drei:** For rendering true 3D WebGL scenes directly within our Next.js components (e.g., dynamic backgrounds, 3D game pieces).
3.  **Lottie (lottie-react):** For embedding complex, high-fidelity vector animations (e.g., loading states, success fireworks, AI thinking indicators).
4.  **Radix UI Primitives (via shadcn/ui):** To instantly upgrade the accessibility and functionality of complex components (dropdowns, dialogs, tooltips) while allowing us to style them perfectly to the new aesthetic.
5.  **Lucide React:** A clean, consistent icon set to replace any mismatched SVG assets.
6.  *(Retained)* **Tailwind CSS:** We will heavily configure Tailwind to support the new spatial utilities (complex shadows, radial gradients, exact blur values).

## 3. Phased Implementation Strategy

### Phase 1: Foundation & Theming (Immediate)
- Update `package.json` with the new dependencies (`framer-motion`, `three`, `@react-three/fiber`, `@react-three/drei`, `lucide-react`, `clsx`, `tailwind-merge`).
- Re-architect `tailwind.config.mjs` to include advanced glass, shadow, and lighting utilities.
- Overhaul `app/globals.css` with the new "Spatial Computing" base layers (ambient backgrounds, refined scrollbars).
- Implement a utility `cn()` function for dynamic class merging (essential for complex Framer Motion + Tailwind setups).

### Phase 2: Core Navigation & Layout Dynamics
- Wrap the main application in a Framer Motion `AnimatePresence` for seamless page transitions.
- Upgrade the `Navbar` and `BottomTabNav` with magnetic hover effects, active indicator layout animations, and deep glassmorphism.
- Convert basic cards (like `NexusCard`) to interactive 3D-tilt or spring-scaled components.

### Phase 3: The "Ultra HD" Games Experience
- Redesign the `NexusRoomManager` UI elements (lobbies, player lists) to use staggered entrance animations.
- Introduce "Ghost Typing" and real-time pulsing indicators for multiplayer states using Framer Motion.
- Overhaul the AI Forge and Sarcastic Judge displays with cinematic reveals and Lottie/SVG success states.
- Ensure all game inputs and buttons use the new, premium Radix/shadcn-inspired styling with haptic feedback.

### Phase 4: Immersive 3D Integration (The "Out of this World" Factor)
- Introduce an `<ambientCanvas>` using React Three Fiber on the homepage and game backgrounds.
- Create 3D particle systems that react to scroll position or game state (e.g., particles speeding up when a game timer is low).

## 4. Constraint Overrides (For Agents)
*This document supersedes the legacy constraints in `AGENTS.md` and `docs/codex-codebase-brief.md` regarding CSS and dependency limits.*
- **ALLOWED:** `framer-motion`, `three.js`, UI component libraries.
- **ALLOWED:** Complex CSS-in-JS (via Framer Motion styles) when strictly necessary for physics interpolation.
- **MAINTAINED:** The project remains strictly `.js` (no TypeScript), uses App Router, and utilizes `gemini-2.5-flash` exclusively for AI.
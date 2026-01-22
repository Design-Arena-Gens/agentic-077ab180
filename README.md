## Agentic — Personal AI Companion

Agentic is a Next.js workspace for a personal AI assistant that blends strategic planning, creative ideation, and wellbeing rituals. Tailor the persona, feed in your current context, and receive focused guidance in real time.

### Highlights
- Persona presets (`Navigator`, `Sparks`, `Guardian`, `Maestro`) with custom tones and strengths.
- Rich chat surface with markdown rendering, quick prompt shortcuts, and auto-scrolling.
- Daily focus inputs, mood tracking, and micro-goal toggles to ground responses in what's happening now.
- Server-side prompt orchestration that threads persona, profile, and task context into every model call.

### Local Setup
```bash
npm install
npm run dev
```

Visit `http://localhost:3000` once the dev server is running.

### Environment Variables
- `OPENAI_API_KEY` *(required)* — used by the `/api/chat` route to call OpenAI.
- `OPENAI_MODEL` *(optional)* — defaults to `gpt-4o-mini`.

Set them locally before building or starting the dev server, and configure the same keys in your Vercel project settings for production.

### Scripts
- `npm run dev` – start the development server.
- `npm run lint` – run ESLint.
- `npm run build` – compile the production bundle.

### Deployment
Agentic is optimized for Vercel. After exporting the environment variables, deploy with:
```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-077ab180
```

### Key Files
- `src/app/page.tsx` — client UI, persona selection, chat orchestration.
- `src/app/api/chat/route.ts` — API route that validates input and calls OpenAI.
- `src/lib/presets.ts` — persona catalog and descriptions.
- `src/lib/prompt.ts` — system prompt builder that merges persona, profile, and tasks.
- `src/types/assistant.ts` — shared typing for persona and task objects.

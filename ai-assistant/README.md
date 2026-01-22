## Agentic — Personal AI Companion

Agentic is a Next.js workspace for a personal AI assistant that blends strategic planning, creative ideation, and wellbeing rituals. Tailor the persona, feed in your current context, and receive focused guidance in real time.

### Highlights
- Persona presets (`Navigator`, `Sparks`, `Guardian`, `Maestro`) with distinct tones and strengths.
- Immersive chat surface with markdown rendering, quick prompt shortcuts, and auto-scrolling.
- Daily focus inputs, mood tracking, and micro-goal toggles that ground the assistant’s responses.
- Server-side prompt weaving that combines persona, profile, and tasks for every model call.

### Local Setup
```bash
npm install
npm run dev
```

Open `http://localhost:3000` to interact with the assistant.

### Environment Variables
- `OPENAI_API_KEY` *(required)* — used by `src/app/api/chat/route.ts`.
- `OPENAI_MODEL` *(optional)* — defaults to `gpt-4o-mini`.

Set them locally before running `npm run dev` or `npm run build`, and configure the same keys in Vercel for production.

### Scripts
- `npm run dev` – start the development server.
- `npm run lint` – run ESLint.
- `npm run build` – generate the production build.

### Deployment
With environment variables in place, deploy straight to Vercel:
```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-077ab180
```

### Key Files
- `src/app/page.tsx` — client UI, persona selection, chat orchestration.
- `src/app/api/chat/route.ts` — API route validating payloads and calling OpenAI.
- `src/lib/presets.ts` — persona catalog and descriptions.
- `src/lib/prompt.ts` — system prompt builder mixing persona, profile, and tasks.
- `src/types/assistant.ts` — shared typing for personas, profile, and tasks.

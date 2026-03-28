# GiftMind MVP — Architecture & Specification

This document is the canonical reference for the GiftMind MVP build.

---

## What We're Building

GiftMind is a free AI-powered gift decision assistant for Indian users (22–35 age group). It helps people figure out **what kind of gift** would be meaningful — before they shop. It does **not** show products or act as a marketplace. It outputs vivid, specific gift **directions** with reasoning.

### Two Core Experiences

1. **Gift Compass** — A gamified elimination journey. User taps through 6 forks → AI generates a specific gift direction. No typing. Under 3 minutes.
2. **GiftMind Chat** — A reflective AI conversation. AI asks deep questions about the recipient → synthesizes a personalized gift direction with reasoning.

Both produce the same output: a **Direction Card** with headline + detail + "why this resonates" + "gift story" (card message) + "where to look" suggestions.

---

## Tech Stack (Non-Negotiable)

- **Next.js 14** (App Router) — not Pages Router
- **Tailwind CSS**
- **Framer Motion** for animations
- **Groq SDK** for LLM — model: `llama-3.3-70b-versatile`
- **Streaming** for chat responses
- **Deploy target:** Vercel
- **No** database, **no** auth, **no** Redux, **no** Docker, **no** separate backend

---

## Design System


| Token         | Value                               |
| ------------- | ----------------------------------- |
| Primary       | `#6C5CE7` (deep purple)             |
| Secondary     | `#FF6B6B` (warm coral)              |
| Accent        | `#FDCB6E` (gold)                    |
| Background    | `#FAFAF8` (off-white)               |
| Card bg       | White with soft shadow              |
| Text          | `#2D3436` (near-black)              |
| Muted text    | `#636E72`                           |
| Border radius | 12px cards, 8px buttons, 24px pills |
| Font          | Inter (`next/font/google`)          |


**UX:** Generous whitespace — app should feel spacious and warm. **Mobile-first** — everything must work beautifully on phone screens.

---

## User Flow

```
Landing Page (/)
    │
    ├── [Try Gift Compass] → /compass
    │       Fork 1 (Who?) → Fork 2 (Occasion?) → Fork 3 → Fork 4 → Fork 5 → Fork 6
    │                                                                          │
    │                                                                   Loading state
    │                                                                          │
    │                                                              /compass/result
    │                                                              Direction Card
    │                                                                   │
    │                                                    ┌──────────────┼──────────────┐
    │                                              [Love it!]    [Go deeper]    [Start over]
    │                                                    │              │              │
    │                                              celebration    /chat?params    /compass
    │
    └── [Talk to GiftMind] → /chat
            AI conversation (4-5 turns, streamed)
                    │
            [Generate direction] button appears
                    │
              /chat/result
              Direction Card (same component)
```

---

## File Structure

```
gift-mind/
├── architecture.md                # This file — full spec reference
├── src/
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js                # Landing page
│   │   ├── globals.css
│   │   ├── compass/
│   │   │   ├── page.js            # Compass fork journey
│   │   │   └── result/
│   │   │       └── page.js        # Compass direction output
│   │   ├── chat/
│   │   │   ├── page.js            # GiftMind conversation
│   │   │   └── result/
│   │   │       └── page.js        # Chat direction output
│   │   └── api/
│   │       ├── compass/
│   │       │   └── generate/
│   │       │       └── route.js   # POST: forks → Groq → direction JSON
│   │       └── chat/
│   │           ├── message/
│   │           │   └── route.js   # POST: messages → Groq → streamed response
│   │           └── synthesize/
│   │               └── route.js   # POST: full convo → Groq → direction JSON
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── ForkCard.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── DirectionCard.jsx  # HERO component — most important
│   │   │   ├── ChatBubble.jsx
│   │   │   └── TypingIndicator.jsx
│   │   ├── compass/
│   │   │   └── CompassJourney.jsx
│   │   └── chat/
│   │       └── ChatInterface.jsx
│   └── lib/
│       ├── groq.js
│       ├── prompts.js
│       ├── compass-data.js
│       └── where-to-look.js
├── .env.local                     # GROQ_API_KEY=gsk_...
├── tailwind.config.js
├── next.config.js
└── package.json
```

---

## Compass Fork Definitions

Source: `src/lib/compass-data.js` — use **exactly** this data.

```javascript
export const compassForks = [
  {
    id: "step0_recipient",
    question: "Who are you gifting?",
    subtitle: "Pick the closest match",
    options: [
      { label: "Partner / Spouse", value: "partner", emoji: "💑" },
      { label: "Mom or Dad", value: "parent", emoji: "👨‍👩‍👧" },
      { label: "Sibling", value: "sibling", emoji: "👫" },
      { label: "Close Friend", value: "friend", emoji: "🫂" },
      { label: "Someone I don't know well", value: "acquaintance", emoji: "🤝" }
    ]
  },
  {
    id: "step1_occasion",
    question: "What's the occasion?",
    subtitle: "Or the closest vibe",
    options: [
      { label: "Birthday", value: "birthday", emoji: "🎂" },
      { label: "Festival (Diwali, Rakhi, etc.)", value: "festival", emoji: "🪔" },
      { label: "Wedding / Anniversary", value: "wedding_anniversary", emoji: "💍" },
      { label: "Just because / Thank you", value: "just_because", emoji: "💛" },
      { label: "Housewarming / New chapter", value: "new_chapter", emoji: "🏡" }
    ]
  },
  {
    id: "step2_experience",
    question: "Something to DO together, or something they enjoy on their own?",
    options: [
      { label: "An experience we share together", value: "together", emoji: "👥" },
      { label: "Something they enjoy solo", value: "solo", emoji: "🧘" },
      { label: "Not sure — surprise me", value: "surprise", emoji: "✨" }
    ]
  },
  {
    id: "step3_vibe",
    question: "What should this gift feel like?",
    options: [
      { label: "Makes a regular day feel special", value: "daily_special", emoji: "☀️" },
      { label: "Tied to a memory or milestone", value: "milestone_memory", emoji: "📸" },
      { label: "Something completely unexpected", value: "unexpected", emoji: "🎁" }
    ]
  },
  {
    id: "step4_nature",
    question: "What kind of gift resonates more?",
    options: [
      { label: "Something they've never tried", value: "new_experience", emoji: "🆕" },
      { label: "Something they already love, but elevated", value: "elevated", emoji: "⬆️" },
      { label: "Something handmade or deeply personal", value: "handmade_personal", emoji: "🤲" }
    ]
  },
  {
    id: "step5_practical",
    question: "Last one — lean practical or lean sentimental?",
    options: [
      { label: "Practical — they'll use it daily", value: "practical", emoji: "🔧" },
      { label: "Sentimental — it's about the feeling", value: "sentimental", emoji: "💝" },
      { label: "A mix of both", value: "both", emoji: "⚖️" }
    ]
  }
];
```

---

## Where to Look Mapping

Source: `src/lib/where-to-look.js` — use **exactly** this data.

```javascript
export const whereToLookMap = {
  experience_together: [
    { name: "BookMyShow", type: "experiences", url: "https://bookmyshow.com" },
    { name: "Xoxoday", type: "experiences", url: "https://xoxoday.com" },
    { name: "Search local workshops near you", type: "offline", url: null }
  ],
  artisan_handmade: [
    { name: "Jaypore", type: "artisan", url: "https://jaypore.com" },
    { name: "iTokri", type: "artisan", url: "https://itokri.com" },
    { name: "Amazon Handmade", type: "marketplace", url: "https://amazon.in" }
  ],
  stationery_artisan: [
    { name: "William Penn", type: "specialty", url: "https://williampennindia.com" },
    { name: "Anemos", type: "artisan", url: "https://anemos.in" },
    { name: "Local stationery stores", type: "offline", url: null }
  ],
  food_gourmet: [
    { name: "Smoor", type: "premium", url: "https://smoor.in" },
    { name: "Vahdam Teas", type: "premium", url: "https://vahdamteas.com" },
    { name: "The Gourmet Box", type: "subscription", url: "https://thegourmetbox.in" }
  ],
  home_decor: [
    { name: "Fabindia", type: "artisan", url: "https://fabindia.com" },
    { name: "Good Earth", type: "premium", url: "https://goodearth.in" },
    { name: "Chumbak", type: "quirky", url: "https://chumbak.com" }
  ],
  wellness_selfcare: [
    { name: "Forest Essentials", type: "premium", url: "https://forestessentialsindia.com" },
    { name: "Kama Ayurveda", type: "ayurvedic", url: "https://kamaayurveda.com" },
    { name: "Nykaa", type: "marketplace", url: "https://nykaa.com" }
  ],
  books_learning: [
    { name: "Amazon Books", type: "marketplace", url: "https://amazon.in/books" },
    { name: "Juggernaut Books", type: "indie", url: "https://juggernaut.in" },
    { name: "Your local bookstore", type: "offline", url: null }
  ],
  tech_gadget: [
    { name: "Amazon Electronics", type: "marketplace", url: "https://amazon.in" },
    { name: "Croma", type: "retail", url: "https://croma.com" },
    { name: "iStore (for Apple)", type: "specialty", url: "https://istoreispp.com" }
  ],
  plants_garden: [
    { name: "Ugaoo", type: "online nursery", url: "https://ugaoo.com" },
    { name: "NurseryLive", type: "online nursery", url: "https://nurserylive.com" },
    { name: "Local plant nurseries", type: "offline", url: null }
  ],
  fashion_accessories: [
    { name: "Jaypore", type: "artisan", url: "https://jaypore.com" },
    { name: "Myntra", type: "marketplace", url: "https://myntra.com" },
    { name: "The Messy Corner", type: "personalized", url: "https://themessycorner.in" }
  ],
  default: [
    { name: "Amazon India", type: "marketplace", url: "https://amazon.in" },
    { name: "FNP (Ferns N Petals)", type: "gifting", url: "https://fnp.com" },
    { name: "IGP", type: "gifting", url: "https://igp.com" }
  ]
};
```

---

## System Prompts

Source: `src/lib/prompts.js` — use **exactly** this code (all four exports).

```javascript
export const CORE_SYSTEM_PROMPT = `You are GiftMind — an emotionally intelligent gift thinking partner for people in India.

YOUR ROLE:
- You help people figure out WHAT KIND of gift would be meaningful for someone they care about
- You do NOT suggest specific products or brand names in the direction — you suggest a TYPE/IDEA of gift
- You generate vivid, specific gift DIRECTIONS — concrete ideas with reasoning
- You help users surface things they already know about the recipient but haven't connected to gifting

YOUR PRINCIPLES:
- Be specific: NOT "something artsy" but "a miniature Tanjore painting because she's been redecorating with South Indian art"
- Every direction must connect to something about the recipient — their personality, habits, wishes, or the relationship history
- The best gifts = Personal knowledge of the recipient × Connection to a shared memory or specific interest × Element of surprise
- Always explain WHY the direction would resonate — this builds the giver's confidence
- Think about what would make the recipient say "how did you know?"

INDIAN CULTURAL CONTEXT:
- Diwali: sweets, dry fruits, decorative items, gold coins are traditional. Avoid black/white wrapping. Gifts symbolize prosperity and goodwill.
- Rakhi: brothers give gifts to sisters after tying rakhi. Gift should match closeness of bond. Common: gadgets, accessories, experiences, cash.
- Weddings: cash in shagun amounts (ending in 1: ₹501, ₹1001, ₹5001). Avoid sets of 4 (inauspicious). No knives/scissors (symbolize cutting ties). No leather for Hindu families. Gold jewelry is significant in South Indian weddings.
- General: gift with both hands as a sign of respect. Odd numbers are auspicious. White flowers are for funerals — avoid them. Yellow, red, green wrapping is auspicious.
- Regional: North India = cash gifts common, sweets/dry fruits for festivals; South India = gold jewelry for weddings, silk sarees, temple-inspired items; East India = sweets like sandesh and rasgulla; West India = utensils, home decor, dry fruits.
- In-laws: navigate carefully — not too casual (disrespectful), not too expensive (showing off), not too cheap (dismissive). The sweet spot is thoughtful and moderate.
- For people you don't know well: cultural appropriateness matters MORE — default to safe, universally appreciated directions.

OUTPUT FORMAT (when generating a final direction):
Always return ONLY valid JSON with this exact structure, no other text before or after:
{
  "direction": {
    "headline": "A specific vivid gift idea in 8-15 words",
    "detail": "1-2 sentences explaining the idea concretely — what it is and how to make it happen",
    "why_it_resonates": "1-2 sentences connecting this direction to what you know about the recipient — why THIS gift for THIS person",
    "gift_story": "A 2-3 line heartfelt message the giver could write on a card. Make it personal, warm, and specific to the relationship.",
    "category": "one of: experience_together, artisan_handmade, stationery_artisan, food_gourmet, home_decor, wellness_selfcare, books_learning, tech_gadget, plants_garden, fashion_accessories, default"
  }
}`;

export const COMPASS_PROMPT_TEMPLATE = (recipient, occasion, forks) => {
  return `The user made these choices through a guided gift compass journey:
- Recipient: ${recipient}
- Occasion: ${occasion}
- Experience preference: ${forks.step2_experience || 'not specified'}
- Gift vibe: ${forks.step3_vibe || 'not specified'}
- Gift nature: ${forks.step4_nature || 'not specified'}
- Practical vs sentimental: ${forks.step5_practical || 'not specified'}

Generate ONE gift direction that precisely matches ALL their selections. Be vivid, specific, and creative — not a generic category but a concrete, giftable idea that would make the recipient feel truly seen.
Return ONLY the JSON object in the format specified. No other text, no markdown, no code fences.`;
};

export const CHAT_SYSTEM_PROMPT = `
CONVERSATION RULES:
- You are having a warm, curious conversation to understand the recipient deeply
- Ask ONE question at a time — never multiple questions in one message
- Build on what the user just shared — don't ask disconnected questions
- Use these types of questions (pick 4-5 across the conversation, adapt based on context):
  * "What does a perfect [day off / Sunday / evening] look like for them?"
  * "What's something they do for others but never for themselves?"
  * "What have they been complaining about or wishing for lately?"
  * "What's a memory you share with them that still makes you both smile?"
  * "If you could describe them in 3 words, what would they be?"
  * "What did you give them last time? How did it land?"
  * "What would genuinely surprise them — something they'd never expect you to notice about them?"
- Keep tone warm, curious, and conversational — like a thoughtful friend helping over chai, not a therapist or a form
- After 4-5 exchanges (when you feel you have enough), transition naturally by saying something like: "I think I have a really clear picture now. Let me put together something special for you..." — this signals the frontend to show the generate button
- NEVER suggest products or specific gift ideas during the conversation — only at synthesis time
- Keep your messages concise — 2-3 sentences max per turn
- If the user gives very short answers, ask warmer, easier questions to draw them out
- If the user is detailed, go deeper on the most interesting thing they shared`;

export const SYNTHESIS_PROMPT = `Based on the entire conversation above, generate ONE highly personalized gift direction.

CRITICAL RULES:
- The direction MUST connect to specific things the user shared — names, habits, memories, wishes, frustrations
- Reference concrete details from the conversation in the "why_it_resonates" field
- Make the "gift_story" feel like it could ONLY have been written by this specific giver for this specific recipient — it should feel intimate and personal
- The headline should be vivid and specific — someone reading it should immediately picture the gift
- Return ONLY the JSON object in the format specified. No other text, no markdown, no code fences.`;
```

---

## Groq Client

Source: `src/lib/groq.js` — use **exactly** this code.

```javascript
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateCompletion(messages, stream = false) {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: messages,
    temperature: 0.8,
    max_tokens: 1024,
    stream: stream,
  });
  return response;
}

export { groq };
```

---

## API Endpoint Specifications

### `POST /api/compass/generate`

**Body:** `{ recipient: string, occasion: string, forks: { step2_experience, step3_vibe, step4_nature, step5_practical } }`

1. Messages: `[{ role: "system", content: CORE_SYSTEM_PROMPT }, { role: "user", content: COMPASS_PROMPT_TEMPLATE(...) }]`
2. `generateCompletion(messages, false)`
3. Text from `response.choices[0].message.content`
4. Strip code fences before parse:
  `text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()`  
   then `JSON.parse`
5. `where_to_look` = `whereToLookMap[parsed.direction.category]` or `whereToLookMap.default`
6. `NextResponse.json({ direction, where_to_look })`
7. On failure: 500 + `{ error: message }`

### `POST /api/chat/message`

**Body:** `{ messages: [{ role, content }], recipient: string, occasion: string }`

1. Groq messages: `[{ role: "system", content: CORE_SYSTEM_PROMPT + "\n\n" + CHAT_SYSTEM_PROMPT }, ...messages]`
2. Stream with `stream: true`
3. Return `ReadableStream` SSE — implementation pattern:

```javascript
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of response) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
      }
    }
    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
    controller.close();
  }
});
return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
});
```

1. Each chunk: `data: {"text":"..."}\n\n`; end with `data: [DONE]\n\n`

### `POST /api/chat/synthesize`

**Body:** `{ messages, recipient, occasion }`

Same pattern as compass: system = `CORE_SYSTEM_PROMPT + "\n\n" + SYNTHESIS_PROMPT` plus conversation; non-streaming; strip fences; parse JSON; attach `where_to_look` from category.

---

## DirectionCard (HERO) — Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  🎁 YOUR GIFT DIRECTION                                 │
│                                                          │
│  [Headline — text-2xl, bold, purple-tinted]             │
│                                                          │
│  [Detail — body text, 1-2 lines, comfortable spacing]   │
│                                                          │
│  ── ── ── ── ── ── ── ── ── ── ── ── ── ── ──         │
│                                                          │
│  💡 Why this resonates                                   │
│  [Reasoning — highlighted block]                         │
│                                                          │
│  ── ── ── ── ── ── ── ── ── ── ── ── ── ── ──         │
│                                                          │
│  💌 What to write on the card                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │ "Gift story..."                    [📋 Copy]       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  📍 Where to look — pills with links                     │
│                                                          │
│  [Love it! ✨]  [Go deeper 💬]  [Start over 🔄]         │
└─────────────────────────────────────────────────────────┘
```

**Styling:** White bg, `rounded-xl`, `p-6`–`p-8`, soft `shadow-lg`. Gift story: left border accent (gold/coral), cream background, italic. Pills: `rounded-full`. **Framer Motion:** fade in + scale `0.95 → 1` on mount.

---

## Critical Rules

1. **All LLM calls are server-side** — API routes only. Never expose `GROQ_API_KEY` to the client.
2. **Compass forks are client-only** until all 6 steps complete — then one API call.
3. `**"use client"`** on every page/component using hooks, Framer Motion, `onClick`, or `sessionStorage`.
4. **JSON safety:** strip code fences before `JSON.parse`; always try/catch.
5. `**sessionStorage`:** key e.g. `giftmind_direction`; guard with `typeof window !== 'undefined'`.
6. **DirectionCard** is the most polished UI surface.
7. **No placeholder data** — use real forks, prompts, and where-to-look maps from this doc.
8. **Mobile-first** — large tap targets on compass; chat input sticky at bottom.

---

## Build Phases (Summary)


| Phase | Scope                                                                |
| ----- | -------------------------------------------------------------------- |
| **1** | `architecture.md`, `src/lib/`*, layout/globals/page stub, Tailwind   |
| **2** | All `src/components/ui/`* (+ optional `/test`)                       |
| **3** | `/api/compass/generate`, `/api/chat/message`, `/api/chat/synthesize` |
| **4** | Compass journey + result pages                                       |
| **5** | Chat interface + result page; Go Deeper query params                 |
| **6** | Landing page, polish, errors, mobile                                 |


### Phase 1 — Foundation

- This file + `groq.js`, `prompts.js`, `compass-data.js`, `where-to-look.js`
- `layout.js`: Inter, metadata, body classes
- `globals.css`: Tailwind only, no default Next clutter
- `page.js`: “GiftMind — Coming Soon” centered

**Test:** `npm run dev` — correct font, off-white bg, no import errors.

### Phase 2 — Shared UI

Button, ForkCard, ProgressBar, DirectionCard, ChatBubble, TypingIndicator — all `"use client"`.

### Phase 3 — APIs

curl tests for compass generate and streaming chat message.

### Phase 4 — Compass

`CompassJourney`, `/compass`, `/compass/result`, sessionStorage, loading/error.

### Phase 5 — Chat

`ChatInterface`, `/chat`, `/chat/result`, streaming SSE, synthesis, triggers for generate button.

### Phase 6 — Ship

Full landing, animations, responsive behavior, friendly errors, copy feedback.

---

## Manual API Tests (curl)

```bash
curl -X POST http://localhost:3000/api/compass/generate \
  -H "Content-Type: application/json" \
  -d '{"recipient":"parent","occasion":"birthday","forks":{"step2_experience":"solo","step3_vibe":"daily_special","step4_nature":"elevated","step5_practical":"sentimental"}}'

curl -N -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"I need a gift for my mom turning 58"}],"recipient":"Mom","occasion":"Birthday"}'
```

---

*End of architecture specification.*
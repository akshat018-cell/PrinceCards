import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// ── Types mirrored from the frontend (no shared import to keep route self-contained) ──
type VibeType  = "Traditional" | "Royal" | "Modern" | "Quirky";
type EventName = "Haldi" | "Mehendi" | "Sangeet" | "Wedding" | "Reception";

interface EventDetail {
  date:  string;
  time:  string;
  venue: string;
}

interface FamilyMember {
  name:         string;
  relationship: string;
  placement:    string;
}

interface GenerateWordingRequest {
  vibe:           VibeType;
  selectedEvents: EventName[];
  eventDetails:   Record<EventName, EventDetail>;
  brideFamily:    FamilyMember[];
  groomFamily:    FamilyMember[];
}

// ── Build a rich, structured prompt from the wizard data ──────────────────────
function buildPrompt(data: GenerateWordingRequest): string {
  const { vibe, selectedEvents, eventDetails, brideFamily, groomFamily } = data;

  // Flatten family members into readable strings
  const formatFamily = (members: FamilyMember[], side: string) => {
    const coverMembers  = members.filter((m) => m.placement === "Cover Page");
    const eventMembers  = members.filter((m) => m.placement === "Event Pages");
    const lastMembers   = members.filter((m) => m.placement === "Last Page");
    const fmt = (list: FamilyMember[]) =>
      list.length ? list.map((m) => `${m.name} (${m.relationship})`).join(", ") : "none listed";
    return `  ${side}:
    - Cover Page: ${fmt(coverMembers)}
    - Event Pages: ${fmt(eventMembers)}
    - Last Page: ${fmt(lastMembers)}`;
  };

  // Build events summary
  const eventsSummary = selectedEvents
    .map((ev) => {
      const d = eventDetails[ev];
      const parts = [d.date, d.time, d.venue].filter(Boolean).join(" | ");
      return `  - ${ev}${parts ? `: ${parts}` : " (details TBD)"}`;
    })
    .join("\n");

  return `
Wedding Vibe: ${vibe}

Events being celebrated:
${eventsSummary}

Family Members:
${formatFamily(brideFamily, "Bride's Side")}
${formatFamily(groomFamily, "Groom's Side")}
`.trim();
}

// ── System instruction ────────────────────────────────────────────────────────
function buildSystemInstruction(vibe: VibeType): string {
  const toneGuide: Record<VibeType, string> = {
    Traditional:
      "Use highly respectful, classical Hindi/Sanskrit phrases (e.g., 'श्री गणेशाय नमः', 'Shubh Vivah'). " +
      "The language must be warm, pious, and rooted in Indian cultural tradition. " +
      "Address guests with reverence ('your esteemed presence', 'kind blessings'). " +
      "Include a Sanskrit shloka or blessing if appropriate.",

    Royal:
      "Use regal, palatial, and formally elevated English. " +
      "Phrases like 'request the honour of your distinguished presence', 'esteemed families', " +
      "'this grand occasion' must feel like a Maharaja's court invitation. " +
      "The tone is dignified, grand, and timeless — never casual.",

    Modern:
      "Use clean, contemporary, and heartfelt English. Short sentences. " +
      "Warm but not overly formal — like a beautifully written personal note. " +
      "Think: 'Two hearts. One beautiful journey. We'd love for you to be there.' " +
      "Avoid heavy ornamentation. Keep it crisp and genuine.",

    Quirky:
      "Use playful, witty, and fun language with light humour and personality. " +
      "Emojis are welcome (🎉💍✨). Phrases like 'plot twist', 'chaos and love', " +
      "'you're invited to the party of the century' are perfect. " +
      "Keep it joyful, irreverent, and completely unique — not generic.",
  };

  return `You are an expert Indian wedding invitation copywriter with 20 years of experience crafting premium, culturally-sensitive invitation wording for high-end clients across India.

Your task is to write the COVER PAGE wording for a multi-page wedding invitation PDF. This is the most important page — it must immediately captivate the reader.

TONE GUIDE for this invitation (${vibe}):
${toneGuide[vibe]}

STRICT RULES:
1. Output ONLY the wording text. No headings, no labels, no explanations, no markdown.
2. The wording must be a single, cohesive, beautifully flowing paragraph or short verse — NOT a bulleted list.
3. Naturally weave in the names of the family members provided (especially Cover Page members) as the hosts/blessers of the event.
4. Do NOT include specific event dates/times/venues in the cover wording — those appear on separate event pages.
5. Keep it between 60 and 120 words — concise yet rich.
6. End with a warm, memorable closing line that feels like a personal embrace.
7. If the vibe is Traditional, you may open with a Sanskrit/Hindi phrase but the rest must be in English.`;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Validate API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  // 2. Parse and validate request body
  let body: GenerateWordingRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { vibe, selectedEvents, eventDetails, brideFamily, groomFamily } = body;
  if (!vibe || !selectedEvents?.length) {
    return NextResponse.json(
      { error: "Missing required fields: vibe and selectedEvents." },
      { status: 400 }
    );
  }

  // 3. Call Gemini
  try {
    const ai = new GoogleGenAI({ apiKey });

    const userPrompt = buildPrompt({ vibe, selectedEvents, eventDetails, brideFamily, groomFamily });
    const systemInstruction = buildSystemInstruction(vibe);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.85,
        topP: 0.95,
        maxOutputTokens: 512,
      },
    });

    const wording = response.text?.trim();

    if (!wording) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ wording }, { status: 200 });

  } catch (err: unknown) {
    console.error("[generate-wording] Gemini API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error from Gemini API.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

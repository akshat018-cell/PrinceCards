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
  brideName?:     string;
  groomName?:     string;
}

// ── Build the user prompt ─────────────────────────────────────────────────────
function buildPrompt(data: GenerateWordingRequest): string {
  const { vibe, selectedEvents, eventDetails, brideFamily, groomFamily, brideName, groomName } = data;

  const formatFamily = (members: FamilyMember[], side: string) => {
    const fmt = (list: FamilyMember[]) =>
      list.length ? list.map((m) => `${m.name} (${m.relationship})`).join(", ") : "none listed";
    return `  ${side}:
    - Cover Page: ${fmt(members.filter((m) => m.placement === "Cover Page"))}
    - Event Pages: ${fmt(members.filter((m) => m.placement === "Event Pages"))}
    - Last Page:   ${fmt(members.filter((m) => m.placement === "Last Page"))}`;
  };

  const eventsSummary = selectedEvents
    .map((ev) => {
      const d = eventDetails[ev];
      const parts = [d.date, d.time, d.venue].filter(Boolean).join(" | ");
      return `  - ${ev}${parts ? `: ${parts}` : " (details TBD)"}`;
    })
    .join("\n");

  return `
Couple: ${brideName || "Bride"} & ${groomName || "Groom"}
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
      "Use highly respectful, classical phrases rooted in Indian cultural tradition. " +
      "The language must be warm, pious, and reverential. Include a traditional blessing or invocation.",

    Royal:
      "Use regal, palatial, and formally elevated language. " +
      "Phrases must feel like a Maharaja's court invitation. Dignified, grand, and timeless.",

    Modern:
      "Use clean, contemporary, and heartfelt language. Short sentences. " +
      "Warm but not overly formal — like a beautifully written personal note.",

    Quirky:
      "Use playful, witty, and fun language with light humour and personality. " +
      "Emojis are welcome (🎉💍✨). Keep it joyful and completely unique.",
  };

  return [
    `You are an expert Indian wedding invitation copywriter with 20 years of experience.`,
    ``,
    `Your task: Write a single, beautiful cover-page invitation paragraph in ENGLISH ONLY.`,
    `The paragraph will appear on the front cover of a premium wedding invitation card.`,
    ``,
    `TONE GUIDE (${vibe}):`,
    toneGuide[vibe],
    ``,
    `RULES:`,
    `1. Write 60–120 words of flowing, premium English prose. No bullet points.`,
    `2. Naturally weave in the names of Cover Page family members as the hosts or blessers.`,
    `3. Do NOT mention specific event dates, times, or venues — those appear on separate pages.`,
    `4. Output ONLY the invitation paragraph — no titles, no labels, no JSON.`,
  ].join("\n");
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

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

  const brideName = body.brideName || "Bride";
  const groomName = body.groomName || "Groom";

  try {
    const ai = new GoogleGenAI({ apiKey });

    const userPrompt       = buildPrompt({ vibe, selectedEvents, eventDetails, brideFamily, groomFamily, brideName, groomName });
    const systemInstruction = buildSystemInstruction(vibe);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.8,
        topP:        0.95,
        maxOutputTokens: 512,
      },
    });

    const wording = response.text?.trim() ?? "";

    return NextResponse.json({ wording }, { status: 200 });

  } catch (err: unknown) {
    console.error("[generate-wording] Gemini API error:", err);
    return NextResponse.json(
      { error: "AI wording unavailable. Please try again." },
      { status: 500 }
    );
  }
}

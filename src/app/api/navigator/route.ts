import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminDb, generateFirestoreId } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firebase";
import type { NavigatorLogDocument } from "@/lib/firebase";

// ---------------------------------------------------------------------------
// Environment guard
// ---------------------------------------------------------------------------
if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "[BhilaiSync] Missing required environment variable: GEMINI_API_KEY.\n" +
      "Add it to .env.local and restart the Next.js dev server."
  );
}

// ---------------------------------------------------------------------------
// Gemini client
// Instantiated once at module scope so the SDK reuses the same underlying
// HTTP agent across warm serverless invocations.
// ---------------------------------------------------------------------------
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ---------------------------------------------------------------------------
// System instruction
// ---------------------------------------------------------------------------
const SYSTEM_INSTRUCTION = `You are the BhilaiSync AI Counselor — the official AI guide for freshmen at IIT Bhilai (Indian Institute of Technology Bhilai), located in Raipur, Chhattisgarh, India.

Your role is to answer student questions warmly, concisely, and accurately. You are knowledgeable about:

**Campus Life & Facilities**
- Hostel blocks (boys: Himgir, Bariyarpur, Rajhara; girls: Madanpur), mess timings, and complaint procedures
- The Tech Café (ordering, timings, popular items), library access, sports complex, and medical centre
- Transport: shuttle timings, BRTS bus routes to Raipur, auto-rickshaw stands

**Academic Policies**
- Course registration via the ERP portal, add/drop deadlines, and credit load rules
- Attendance policy (75% minimum per course), relative grading system (AA to FF)
- Internship and placement cell procedures, NOC requirements, and backlog policies
- Research opportunities: SRC (Student Research Cell), faculty labs, and project electives

**Tech & Cultural Events**
- Meraz (annual techno-cultural festival): flagship events, registration, sponsorship contacts
- Solstice (annual technical symposium, organised by DSC IIT Bhilai): hackathons, talks, workshops
- Ongoing club activities: Robotics Club, Coding Club (CP Arena), AI/ML Club, Music Club, Drama Club

**Administrative Guidance**
- Fee payment via SBI Collect, scholarship applications (merit-cum-means, ST/SC, sports)
- ID card, bonafide certificate, and transcript request procedures
- Grievance redressal: Student Affairs office, anti-ragging committee, ICC

**Formatting Rules**
- Always use Markdown: **bold** for key terms, bullet lists for multi-item answers, and numbered steps for procedures.
- Keep answers under 300 words unless the question demands a detailed walkthrough.
- If you do not know a specific detail (e.g. exact current dates), say so and direct the student to the official IIT Bhilai website (https://www.iitbhilai.ac.in) or the Student Affairs office.
- Never fabricate names, phone numbers, or official policies.
- Always end with an encouraging, friendly sign-off relevant to the question.`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NavigatorRequestBody {
  query:     string;
  studentId: string;
}

interface NavigatorSuccessResponse {
  reply:  string;
  cached: false;
}

interface NavigatorErrorResponse {
  error:    string;
  details?: string;
}

// ---------------------------------------------------------------------------
// persistLog — fire-and-forget Firestore writer
// Called without await so the HTTP response is never blocked by the write.
// Failures are logged server-side only; they are non-critical for the user.
// ---------------------------------------------------------------------------
function persistLog(
  studentId: string,
  query:     string,
  aiResponse: string
): void {
  const logId = generateFirestoreId();
  const now   = Date.now();

  const logDoc: NavigatorLogDocument = {
    logId,
    studentId,
    query,
    aiResponse,
    timestamp: now,
  };

  adminDb
    .collection(COLLECTIONS.NAVIGATOR_LOGS)
    .doc(logId)
    .set(logDoc)
    .catch((err: unknown) => {
      console.error(
        `[Navigator API] Background log write failed (logId=${logId}):`,
        err instanceof Error ? err.message : String(err)
      );
    });
}

// ---------------------------------------------------------------------------
// POST /api/navigator
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest
): Promise<NextResponse<NavigatorSuccessResponse | NavigatorErrorResponse>> {

  // ── 1. Parse request body ────────────────────────────────────────────────
  let body: Partial<NavigatorRequestBody>;

  try {
    body = (await request.json()) as Partial<NavigatorRequestBody>;
  } catch {
    return NextResponse.json<NavigatorErrorResponse>(
      {
        error:   "Invalid request body.",
        details: "Body must be valid JSON with Content-Type: application/json.",
      },
      { status: 400 }
    );
  }

  // ── 2. Validate fields ───────────────────────────────────────────────────
  const { query, studentId } = body;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json<NavigatorErrorResponse>(
      {
        error:   "Missing required field: query.",
        details: "The `query` field must be a non-empty string.",
      },
      { status: 400 }
    );
  }

  if (
    !studentId ||
    typeof studentId !== "string" ||
    studentId.trim().length === 0
  ) {
    return NextResponse.json<NavigatorErrorResponse>(
      {
        error:   "Missing required field: studentId.",
        details:
          "The `studentId` field must be a non-empty string (Firebase Auth UID).",
      },
      { status: 400 }
    );
  }

  // Hard-cap query length to control token spend per request.
  const sanitisedQuery     = query.trim().slice(0, 2000);
  const sanitisedStudentId = studentId.trim();

  // ── 3. Call Gemini 1.5 Flash ─────────────────────────────────────────────
  let replyText: string;

  try {
    const response = await ai.models.generateContent({
      model:    "gemini-1.5-flash",
      contents: sanitisedQuery,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature:       0.7,
        maxOutputTokens:   1024,
        topP:              0.9,
        topK:              40,
      },
    });

    // The @google/genai SDK exposes the generated text via response.text.
    // It may be either a plain string property or a callable method depending
    // on the exact SDK build, so we handle both shapes defensively.
    let rawText: string | undefined;

    if (typeof response.text === "function") {
      rawText = (response.text as () => string)();
    } else if (typeof response.text === "string") {
      rawText = response.text;
    }

    if (!rawText || rawText.trim().length === 0) {
      console.error(
        "[Navigator API] Gemini returned an empty response body.",
        JSON.stringify(response)
      );
      return NextResponse.json<NavigatorErrorResponse>(
        {
          error:
            "The AI counselor returned an empty response. " +
            "Please rephrase your question and try again.",
        },
        { status: 502 }
      );
    }

    replyText = rawText.trim();

  } catch (geminiErr: unknown) {
    const message =
      geminiErr instanceof Error ? geminiErr.message : String(geminiErr);

    console.error("[Navigator API] Gemini API error:", message);

    if (
      message.includes("quota") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.includes("429")
    ) {
      return NextResponse.json<NavigatorErrorResponse>(
        {
          error:
            "AI service is temporarily at capacity. " +
            "Please wait a moment and try again.",
          details: "Gemini API quota exceeded.",
        },
        { status: 429 }
      );
    }

    if (
      message.includes("API_KEY_INVALID") ||
      message.includes("401") ||
      message.includes("403")
    ) {
      return NextResponse.json<NavigatorErrorResponse>(
        {
          error:
            "AI service configuration error. " +
            "Please contact the BhilaiSync admin.",
          details: "Gemini API key is invalid or lacks required permission.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json<NavigatorErrorResponse>(
      {
        error:   "Failed to reach the AI counselor. Please try again shortly.",
        details:
          process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }

  // ── 4. Persist log asynchronously (non-blocking) ─────────────────────────
  // intentionally not awaited — response returns to client immediately.
  persistLog(sanitisedStudentId, sanitisedQuery, replyText);

  // ── 5. Return success ─────────────────────────────────────────────────────
  return NextResponse.json<NavigatorSuccessResponse>(
    {
      reply:  replyText,
      cached: false,
    },
    {
      status: 200,
      headers: {
        "Cache-Control":           "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options":  "nosniff",
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Method guard
// ---------------------------------------------------------------------------
export async function GET(): Promise<NextResponse<NavigatorErrorResponse>> {
  return NextResponse.json<NavigatorErrorResponse>(
    { error: "Method not allowed. Use POST /api/navigator." },
    { status: 405, headers: { Allow: "POST" } }
  );
}

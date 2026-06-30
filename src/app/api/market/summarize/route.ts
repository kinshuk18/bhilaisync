import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "description is required." },
        { status: 400 }
      );
    }

    const prompt =
      "You are an assistant for a campus marketplace. Summarize the following item description into a single, short, catchy sentence (max 15 words). Focus on the item, its condition, and any key selling points. Do not use quotes. Description: " +
      description;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    const aiSummary = response.text;

    return NextResponse.json({ aiSummary }, { status: 200 });
  } catch (error) {
    console.error("Failed to generate AI summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}

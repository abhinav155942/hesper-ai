import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  try {
    const { audio, text, config } = await req.json();

    if (text) {
      const response = await ai.models.generateContent({
        model: config?.model || "gemini-2.0-flash-exp",
        contents: text,
      });

      return Response.json({
        success: true,
        text: response.text,
        audio: null,
      });
    } else if (audio) {
      // Handle audio input
      const response = await ai.models.generateContent({
        model: config?.model || "gemini-2.0-flash-exp",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: audio.split(",")[1] || audio,
                  mimeType: "audio/webm",
                },
              },
            ],
          },
        ],
      });

      return Response.json({
        success: true,
        text: response.text,
        audio: null,
      });
    }

    return Response.json(
      { success: false, error: "No input provided" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Gemini Live API Error:", error);
    return Response.json(
      {
        success: false,
        error: error.message || "Failed to process request",
      },
      { status: 500 }
    );
  }
}
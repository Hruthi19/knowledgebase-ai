import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import {
  buildSystemPrompt,
  retrieveContext,
} from "@/lib/retrieval";
import { getErrorMessage } from "@/lib/utils";
import type { SourceChunk } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

function isOpenAIRateLimit(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes("429") || message.includes("rate limit");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages: ChatMessage[] = body.messages ?? [];
    const docIds: string[] | undefined = body.docIds;

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    if (!lastUserMessage?.content?.trim()) {
      return new Response(
        JSON.stringify({ error: "A user message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { context, sources } = await retrieveContext(
      lastUserMessage.content,
      docIds
    );

    const systemPrompt = buildSystemPrompt(context);

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      temperature: 0.3,
    });

    const sourcesHeader = JSON.stringify(sources);

    return result.toDataStreamResponse({
      headers: {
        "x-sources": encodeURIComponent(sourcesHeader),
      },
    });
  } catch (error) {
    console.error("[POST /api/chat] Error:", error);

    if (isOpenAIRateLimit(error)) {
      return new Response(
        JSON.stringify({
          error: "OpenAI rate limit reached. Please try again in a moment.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const message = getErrorMessage(error);

    if (message.includes("Pinecone")) {
      return new Response(JSON.stringify({ error: message }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

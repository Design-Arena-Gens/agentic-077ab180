import { NextRequest } from "next/server";
import { OpenAI } from "openai";
import { z } from "zod";
import { personaPresets } from "@/lib/presets";
import { buildSystemPrompt } from "@/lib/prompt";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string().optional(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })
    )
    .min(1),
  personaId: z.string().optional(),
  profile: z
    .object({
      name: z.string().optional(),
      focus: z.string().optional(),
      mood: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  instructions: z.string().optional(),
  tasks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        done: z.boolean(),
      })
    )
    .optional(),
  model: z.string().optional(),
});

export const runtime = "edge";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("Missing OPENAI_API_KEY environment variable.", {
      status: 500,
    });
  }

  const json = await req.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return new Response("Invalid request payload.", { status: 400 });
  }

  const { messages, personaId, profile, instructions, tasks, model } = parsed.data;
  const persona = personaPresets.find((item) => item.id === personaId) ?? personaPresets[0];

  const systemPrompt = buildSystemPrompt({
    persona,
    customInstructions: instructions,
    profile,
    tasks,
  });

  const openAIMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      })),
  ];

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.7,
      messages: openAIMessages,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ??
      "I'm here, but I wasn't able to generate a response just yet. Try again with more detail.";

    return Response.json({ reply });
  } catch (error) {
    console.error("OpenAI chat error", error);
    return new Response("Failed to generate a response.", { status: 500 });
  }
}

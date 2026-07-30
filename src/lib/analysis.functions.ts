import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  kind: z.enum(["soil", "disease"]),
  files: z
    .array(
      z.object({
        name: z.string().min(1),
        mimeType: z.string().min(1),
        dataUrl: z.string().min(16),
      }),
    )
    .min(1)
    .max(4),
  context: z.string().max(2000).optional(),
});

export type AnalysisFinding = {
  label: string;
  value: string;
  status: "good" | "watch" | "critical";
  note: string;
};

export type AnalysisResult = {
  title: string;
  summary: string;
  confidence: number;
  findings: AnalysisFinding[];
  actions: { action: string; timing: string; why: string }[];
  cautions: string[];
};

const SOIL_PROMPT = `You are an agronomist analysing a soil health report (card, lab sheet or photo).
Extract every readable value (pH, EC, organic carbon, N, P, K, S, Zn, Fe, B, texture, moisture) and interpret it.
Findings must quote the actual numbers you read from the document with their units, and state whether each is deficient, sufficient or excessive for typical field crops.
Recommendations must be specific: nutrient, product, dose per hectare/acre, and timing. Never invent values that are not visible — if a value is unreadable, say so.`;

const DISEASE_PROMPT = `You are a plant pathologist analysing photographs of a crop plant.
Identify the crop if possible, then rank the most likely causes of the symptoms (disease, pest, nutrient disorder, abiotic damage) with honest confidence.
Findings must describe the visible evidence (lesion shape, colour, margin, distribution, sporulation) that supports or rules out each candidate.
Recommendations must include cultural control first, then chemical control with active ingredient and dose, plus a note on pre-harvest interval. Be explicit when image quality limits the diagnosis.`;

export const analyzeUpload = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const content: unknown[] = [
      {
        type: "text",
        text:
          (data.kind === "soil" ? SOIL_PROMPT : DISEASE_PROMPT) +
          (data.context ? `\n\nField context from the farmer: ${data.context}` : "") +
          `\n\nRespond with JSON only, matching exactly:
{"title":string,"summary":string,"confidence":number (0-100),"findings":[{"label":string,"value":string,"status":"good"|"watch"|"critical","note":string}],"actions":[{"action":string,"timing":string,"why":string}],"cautions":[string]}
Give 3-8 findings and 2-5 actions.`,
      },
    ];

    for (const file of data.files) {
      if (file.mimeType.startsWith("image/")) {
        content.push({ type: "image_url", image_url: { url: file.dataUrl } });
      } else {
        content.push({
          type: "file",
          file: { filename: file.name, file_data: file.dataUrl },
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "user", content }],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) throw new Error("Too many requests right now — try again in a minute.");
      if (response.status === 402) throw new Error("AI credits are exhausted for this workspace.");
      console.error(`AI gateway failed [${response.status}]: ${body}`);
      throw new Error(`Analysis failed [${response.status}].`);
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const jsonText = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let parsed: AnalysisResult;
    try {
      parsed = JSON.parse(jsonText) as AnalysisResult;
    } catch {
      throw new Error("The model returned an unreadable response. Try again.");
    }

    return {
      title: parsed.title ?? "Analysis",
      summary: parsed.summary ?? "",
      confidence: Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || 0))),
      findings: Array.isArray(parsed.findings) ? parsed.findings.slice(0, 10) : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 6) : [],
      cautions: Array.isArray(parsed.cautions) ? parsed.cautions.slice(0, 5) : [],
    };
  });

import dotenv from "dotenv";

dotenv.config();

const getConfig = () => ({
    apiKey: process.env.AI_API_KEY?.trim(),
    model: process.env.AI_MODEL?.trim() || "gpt-4o-mini",
    baseUrl: (process.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, ""),
});

export const hasExternalAI = () => Boolean(getConfig().apiKey);

const extractJson = (content) => {
    const cleaned = String(content || "")
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start === -1 || end <= start) throw new Error("AI provider returned invalid JSON");
        return JSON.parse(cleaned.slice(start, end + 1));
    }
};

export async function classifyWithExternalAI({ title, description, categories }) {
    const { apiKey, model, baseUrl } = getConfig();
    if (!apiKey) return null;

    const categoryOptions = categories.map((c) => ({
        id: String(c._id),
        name: c.name,
        subCategories: c.subCategories || [],
        department: c.department
            ? { id: String(c.department._id), name: c.department.name }
            : null,
    }));

    const prompt = `You are a civic grievance triage assistant. Return ONLY valid JSON.\nComplaint title: ${title}\nComplaint description: ${description}\nAvailable categories: ${JSON.stringify(categoryOptions)}\nChoose the best category id from the list, choose priority from low, medium, high, critical, give confidence between 0 and 1, and a one-line reason.`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            temperature: 0.1,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: "Classify civic complaints only into the provided categories. Never invent a category ID.",
                },
                { role: "user", content: prompt },
            ],
        }),
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`AI provider returned ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ""}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI provider returned an empty response");

    const parsed = extractJson(content);
    const category = categoryOptions.find((c) => c.id === String(parsed.categoryId));
    if (!category) throw new Error("AI returned an unknown category");

    const priorities = new Set(["low", "medium", "high", "critical"]);
    const priority = priorities.has(parsed.priority) ? parsed.priority : "medium";
    const confidence = Number(parsed.confidence);

    return {
        category,
        priority,
        confidence: Number.isFinite(confidence)
            ? Math.max(0, Math.min(1, confidence))
            : 0.7,
        reason:
            typeof parsed.reason === "string"
                ? parsed.reason.slice(0, 300)
                : "AI classification completed.",
        provider: `external-ai:${model}`,
    };
}

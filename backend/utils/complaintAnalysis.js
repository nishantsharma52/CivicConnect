import Complaint from "../models/complaint.model.js";
import Category from "../models/category.model.js";
import { classifyWithExternalAI, hasExternalAI } from "./ai.service.js";

const STOP_WORDS = new Set([
    "the", "is", "a", "an", "on", "in", "near", "at", "to", "of", "for",
    "and", "or", "with", "this", "that", "there", "my", "our", "very",
    "issue", "problem", "please", "need", "has", "have", "from", "road",
    "area", "street", "city", "nearby",
]);

const tokenize = (text = "") =>
    new Set(
        text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .map((word) => word.trim())
            .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
    );

const similarity = (left, right) => {
    const a = tokenize(left);
    const b = tokenize(right);

    if (!a.size || !b.size) return 0;

    let intersection = 0;
    for (const item of a) {
        if (b.has(item)) intersection += 1;
    }

    return intersection / new Set([...a, ...b]).size;
};

const distanceKm = (a, b) => {
    if (
        a?.latitude === undefined || a?.longitude === undefined ||
        b?.latitude === undefined || b?.longitude === undefined
    ) {
        return null;
    }

    const toRad = (value) => (value * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);

    const haversine =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const priorityFromText = (text = "") => {
    const value = text.toLowerCase();

    if (
        /(live wire|electric shock|fire|flood|gas leak|life threatening|accident|dangerous|collapsed|sewage overflow)/.test(value)
    ) {
        return "critical";
    }

    if (
        /(major|large|severe|urgent|unsafe|injury|accident risk|blocked road|contaminated water|no electricity)/.test(value)
    ) {
        return "high";
    }

    if (/(small|minor|slight|temporary)/.test(value)) {
        return "low";
    }

    return "medium";
};

export const analyzeComplaint = async ({
    title,
    description,
    categoryId,
    location,
}) => {
    const text = `${title || ""} ${description || ""}`.trim();
    const categories = await Category.find({ isActive: true })
        .populate("department", "name category")
        .lean();

    if (hasExternalAI()) {
        try {
            const external = await classifyWithExternalAI({ title, description, categories });
            if (external?.category) {
                const duplicate = await findDuplicateComplaint({
                    categoryId: external.category.id,
                    text,
                    location,
                });
                return {
                    category: categories.find((c) => String(c._id) === String(external.category.id)) || null,
                    priority: external.priority,
                    confidence: external.confidence,
                    isDuplicate: Boolean(duplicate),
                    duplicateOf: duplicate,
                    reason: external.reason,
                    provider: external.provider,
                };
            }
        } catch (error) {
            console.warn("External AI unavailable, using local classifier:", error.message);
        }
    }

    let selected = null;
    let bestScore = 0;
    const tokens = tokenize(text);

    for (const category of categories) {
        const candidates = [category.name, ...(category.subCategories || [])];
        let score = 0;

        for (const candidate of candidates) {
            const candidateTokens = tokenize(candidate);
            if (!candidateTokens.size) continue;

            let hits = 0;
            for (const token of candidateTokens) {
                if (tokens.has(token)) hits += 1;
            }

            const candidateScore = hits / candidateTokens.size;
            score = Math.max(score, candidateScore);
        }

        if (categoryId && String(category._id) === String(categoryId)) {
            score = Math.max(score, 0.9);
        }

        if (score > bestScore) {
            bestScore = score;
            selected = category;
        }
    }

    if (!selected && categoryId) {
        selected = categories.find((item) => String(item._id) === String(categoryId)) || null;
    }

    const aiPriority = priorityFromText(text);
    const confidence = selected
        ? Math.min(Math.max(bestScore || 0.65, 0), 0.99)
        : 0.35;

    const duplicateOf = selected ? await findDuplicateComplaint({ categoryId: selected._id, text, location }) : null;

    return {
        category: selected,
        priority: aiPriority,
        confidence,
        isDuplicate: Boolean(duplicateOf),
        duplicateOf,
        reason: "Local classifier used because no external AI key is configured.",
        provider: "local-heuristic",
    };
};

async function findDuplicateComplaint({ categoryId, text, location }) {
    if (!categoryId) return null;
    const recent = await Complaint.find({
        category: categoryId,
        status: { $in: ["submitted", "under_review", "assigned", "in_progress", "reopened"] },
    })
        .sort({ createdAt: -1 })
        .limit(100)
        .select("_id title description location")
        .lean();

    for (const existing of recent) {
        const textSimilarity = similarity(text, `${existing.title} ${existing.description}`);
        const distance = distanceKm(location, existing.location);
        const sameAddress =
            location?.address && existing.location?.address &&
            location.address.trim().toLowerCase() === existing.location.address.trim().toLowerCase();
        const nearby = distance !== null && distance <= 0.5;
        if ((nearby && textSimilarity >= 0.35) || (sameAddress && textSimilarity >= 0.3) || textSimilarity >= 0.78) return existing._id;
    }
    return null;
}

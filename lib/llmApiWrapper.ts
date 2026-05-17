import { GoogleGenerativeAI } from "@google/generative-ai";

function getApiKey(): string {
  // 1. Check build-time/runtime env variable
  const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (envKey) return envKey;

  // 2. Check query parameter in browser (e.g. ?key=... or ?gemini_key=...)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const queryKey = params.get('gemini_key') || params.get('key');
    if (queryKey) {
      // Persist in localStorage for future visits
      try {
        localStorage.setItem('gemini_api_key', queryKey);
      } catch (e) {
        console.error("Failed to save key to localStorage:", e);
      }
      return queryKey;
    }

    // 3. Check local storage
    try {
      const storedKey = localStorage.getItem('gemini_api_key');
      if (storedKey) return storedKey;
    } catch (e) {
      console.error("Failed to read key from localStorage:", e);
    }
  }

  return "";
}

export interface IntentResult {
  type: 'food' | 'shelter' | 'services' | null;
  urgency: number;
  needs: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  rawPrompt?: string;
}

export async function parseIntent(query: string): Promise<IntentResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("No Gemini API key found. Defaulting to general filtering.");
    return { type: null, urgency: 5, needs: "Unknown needs" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `
You are a dispatcher for an emergency resource network. Based on the user's message, classify their primary need.
Return ONLY a valid JSON object. No markdown blocks, no formatting.
Schema:
{
  "type": "food" | "shelter" | "services" | null,
  "urgency": number (1-10, 10 being immediate danger or severe hunger),
  "needs": string (a short, empathetic summary of their situation, written as if speaking to them, e.g. "I see you need a warm place to stay tonight.")
}

User message: "${query}"
`;
    // We pass JSON config if supported, but simple string prompt works fine for 1.5 flash
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    
    const usage = result.response.usageMetadata;
    
    let responseText = result.response.text().trim();
    // Clean up potential markdown blocks
    if (responseText.startsWith("```json")) {
        responseText = responseText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const data = JSON.parse(responseText);
    
    // Ensure type is valid
    const validTypes = ['food', 'shelter', 'services'];
    const type = validTypes.includes(data.type) ? data.type : null;

    return {
      type: type,
      urgency: data.urgency || 5,
      needs: data.needs || "Let me find some general resources for you.",
      usage: usage ? {
        promptTokens: usage.promptTokenCount,
        completionTokens: usage.candidatesTokenCount,
        totalTokens: usage.totalTokenCount
      } : undefined,
      rawPrompt: prompt
    };
  } catch (error) {
    console.error("Failed to parse intent with Gemini:", error);
    return { type: null, urgency: 5, needs: "I couldn't quite understand that, but here are some resources near you." };
  }
}

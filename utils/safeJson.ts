/**
 * Safely parses JSON strings returned by LLM models, gracefully handling markdown code fences,
 * leading/trailing non-JSON text, and partial strings.
 */
export function safeParseGeminiJson<T>(raw: string): T | null {
  if (!raw) return null;
  
  let cleaned = raw.trim();
  
  // 1. Remove markdown code fences if present (e.g. ```json ... ```)
  const codeFenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeFenceMatch) {
    cleaned = codeFenceMatch[1].trim();
  }
  
  // 2. Direct attempt after clean
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    // Keep going to extract matching brackets
  }

  // 3. Fallback: try to extract the first JSON object or array matching structural boundaries
  try {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(candidate) as T;
    }
  } catch (e) {
    // Keep going
  }

  try {
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const candidate = cleaned.substring(firstBracket, lastBracket + 1);
      return JSON.parse(candidate) as T;
    }
  } catch (e) {
    // Failed everything
  }

  return null;
}

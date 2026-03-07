import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface VerificationResult {
  passed: boolean;
  confidence: number; // 0-100
  reasoning: string;
}

/**
 * Verify if proof image completes the challenge objective
 */
export async function verifyProof(
  imageData: string, // base64
  challengeObjective: string,
  challengeContext?: string
): Promise<VerificationResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a challenge verification AI for VeriSnap, an app where users complete real-world challenges and submit photo proof.

CHALLENGE OBJECTIVE:
${challengeObjective}

${challengeContext ? `ADDITIONAL CONTEXT:\n${challengeContext}\n` : ""}

TASK:
Analyze the submitted photo and determine if the user has successfully completed the challenge objective.

RULES:
1. Be strict but fair - the key elements of the objective must be clearly visible
2. Don't be fooled by edited images, screenshots, or photos of photos
3. The image should appear to be taken live/in-person
4. Focus on whether the OBJECTIVE is met, not artistic quality

Respond in JSON format:
{
  "passed": boolean,
  "confidence": number (0-100),
  "reasoning": "Brief explanation of your decision"
}`;

  // Convert base64 to inline data
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data,
      },
    },
  ]);

  const responseText = result.response.text();
  
  // Parse JSON from response
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        passed: Boolean(parsed.passed),
        confidence: Number(parsed.confidence) || 0,
        reasoning: String(parsed.reasoning || ""),
      };
    }
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
  }

  // Fallback
  return {
    passed: false,
    confidence: 0,
    reasoning: "Failed to verify proof",
  };
}

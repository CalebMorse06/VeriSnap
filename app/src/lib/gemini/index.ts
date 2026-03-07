import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface VerificationResult {
  passed: boolean;
  confidence: number; // 0-100
  reasoning: string;
  fraudIndicators?: string[];
  objectiveMatches?: string[];
}

/**
 * Verify if proof image completes the challenge objective
 * Uses JSON response mode for reliable parsing
 */
export async function verifyProof(
  imageData: string, // base64
  challengeObjective: string,
  challengeContext?: string
): Promise<VerificationResult> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `You are a verification AI for VeriSnap, an app where users stake real money on completing challenges and submit photo proof.

## CHALLENGE OBJECTIVE
${challengeObjective}

${challengeContext ? `## ADDITIONAL CONTEXT\n${challengeContext}\n` : ""}

## YOUR TASK
Analyze the submitted photo and determine if the user has GENUINELY completed the challenge objective.

## VERIFICATION CHECKLIST
1. **Objective Match**: Are the key elements of the objective clearly visible?
2. **Authenticity**: Does this appear to be a live, in-person photo?
3. **Recency**: Does the photo appear to be taken recently (not an old photo)?
4. **No Manipulation**: Check for signs of editing, screenshots, or photos-of-photos
5. **No Deception**: Check for printouts, screens showing images, or other tricks

## FRAUD DETECTION
Watch for these red flags:
- Visible screen bezels or pixels (photo of a screen)
- Unnatural lighting suggesting indoor photo of outdoor scene
- Compression artifacts from re-photographing
- Visible paper edges (printed photo)
- Inconsistent shadows or reflections
- Stock photo watermarks or signatures

## DECISION RULES
- PASS: Objective clearly met, photo appears authentic, no fraud indicators
- FAIL: Objective not met OR fraud indicators detected
- Confidence should reflect certainty (80+ for clear cases, 50-80 for uncertain)

Analyze carefully. Real money is at stake.`;

  // Convert base64 to inline data
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  
  try {
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
    const parsed = JSON.parse(responseText);
    
    return {
      passed: Boolean(parsed.passed),
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
      reasoning: String(parsed.reasoning || ""),
      fraudIndicators: Array.isArray(parsed.fraudIndicators) ? parsed.fraudIndicators : [],
      objectiveMatches: Array.isArray(parsed.objectiveMatches) ? parsed.objectiveMatches : [],
    };
  } catch (e) {
    console.error("Gemini verification error:", e);
    
    // Fallback: try parsing without structured output
    try {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await fallbackModel.generateContent([
        prompt + "\n\nRespond with JSON: {passed: boolean, confidence: number, reasoning: string}",
        { inlineData: { mimeType: "image/jpeg", data: base64Data } },
      ]);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          passed: Boolean(parsed.passed),
          confidence: Number(parsed.confidence) || 0,
          reasoning: String(parsed.reasoning || ""),
        };
      }
    } catch {}

    return {
      passed: false,
      confidence: 0,
      reasoning: "Verification system error - please retry",
    };
  }
}

/**
 * Quick fraud check without full verification
 * Use for pre-screening before expensive operations
 */
export async function quickFraudCheck(imageData: string): Promise<{
  likelyFraud: boolean;
  indicators: string[];
}> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  
  try {
    const result = await model.generateContent([
      `Quick fraud check: Is this a genuine photo or potentially fraudulent (screenshot, photo-of-photo, printed image, stock photo)?
      
Respond with JSON: {"likelyFraud": boolean, "indicators": ["reason1", "reason2"]}`,
      { inlineData: { mimeType: "image/jpeg", data: base64Data } },
    ]);

    const parsed = JSON.parse(result.response.text());
    return {
      likelyFraud: Boolean(parsed.likelyFraud),
      indicators: Array.isArray(parsed.indicators) ? parsed.indicators : [],
    };
  } catch {
    return { likelyFraud: false, indicators: [] };
  }
}

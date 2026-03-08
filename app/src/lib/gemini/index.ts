import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface VerificationResult {
  passed: boolean;
  confidence: number; // 0-100
  reasoning: string;
  sceneDescription: string;
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
  challengeContext?: string,
  mediaType: "image" | "video" = "image"
): Promise<VerificationResult> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const isVideo = mediaType === "video";

  const prompt = `You are a verification AI for VeriSnap, a challenge app where users stake XRP on completing objectives and submit ${isVideo ? "video" : "photo"} proof.

## CHALLENGE OBJECTIVE
${challengeObjective}

${challengeContext ? `## ADDITIONAL CONTEXT\n${challengeContext}\n` : ""}

## YOUR TASK
Analyze the submitted ${isVideo ? "video" : "photo"} and determine if the user has reasonably completed the challenge objective.${isVideo ? `
For video proof, assess the actions performed over time — look for the activity being completed, not just a single frame.
If the objective involves counting repetitions (e.g., pushups, squats, jumps), COUNT the number of reps you observe and include the count in your reasoning (e.g., "I counted approximately 8 pushups").` : ""}

You are verifying for a fun challenge app, not a court of law. If the user appears to be genuinely attempting the challenge, lean toward passing.

## VERIFICATION APPROACH
1. **Objective Match**: Are the key elements of the objective visible or reasonably implied?
2. **Good Faith**: Does this look like a genuine attempt at the challenge?
3. **Basic Authenticity**: No obvious screenshots, stock photos, or printed images

## DECISION RULES
- PASS: Photo reasonably shows the user completing the objective. If the core activity is visible, pass it. Benefit of the doubt.
- FAIL: Objective clearly NOT met (wrong subject entirely, blank photo, obvious fraud like stock photos or screenshots)
- Confidence should reflect certainty (70+ for reasonable matches, 50-70 for borderline)

## SCENE DESCRIPTION
You MUST also describe what you see in the photo in 1-2 sentences. Be specific about objects, people, and actions visible.

Respond with JSON: {"passed": boolean, "confidence": number, "reasoning": string, "sceneDescription": string, "fraudIndicators": string[], "objectiveMatches": string[]}`;

  // Convert base64 to inline data
  const base64Data = imageData.replace(/^data:(image|video)\/[\w.+-]+;base64,/, "");
  const mimeType = isVideo ? "video/webm" : "image/jpeg";

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
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
      sceneDescription: String(parsed.sceneDescription || ""),
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
        { inlineData: { mimeType, data: base64Data } },
      ]);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          passed: Boolean(parsed.passed),
          confidence: Number(parsed.confidence) || 0,
          reasoning: String(parsed.reasoning || ""),
          sceneDescription: String(parsed.sceneDescription || ""),
        };
      }
    } catch (err) { console.warn("[Gemini] Fallback parse failed:", err); }

    return {
      passed: false,
      confidence: 0,
      reasoning: "Verification system error - please retry",
      sceneDescription: "",
    };
  }
}

/**
 * Expand a challenge title into full description, objective, stake, and duration
 * Privacy-preserving: only the title string is sent — no wallet, IP, or metadata
 */
export async function expandTitle(title: string): Promise<{
  description: string;
  objective: string;
  suggestedStakeXrp: number;
  suggestedDurationMinutes: number;
}> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `You are VeriSnap's challenge builder AI. Given a short challenge title, generate a complete challenge definition.

## TITLE
"${title}"

## GENERATE
1. **description**: A 1-2 sentence description of the challenge (fun, motivating tone)
2. **objective**: What the photo proof must show (specific, verifiable visual criteria)
3. **suggestedStakeXrp**: Reasonable XRP stake amount (integer, 1-100 range, based on difficulty)
4. **suggestedDurationMinutes**: Time limit in minutes (5-120, based on complexity)

## RULES
- Keep descriptions concise and action-oriented
- Objectives must be visually verifiable from a single photo
- Stakes should match difficulty (easy=5, medium=10-20, hard=50+)
- Duration should be realistic for the activity

Respond with JSON: {"description": string, "objective": string, "suggestedStakeXrp": number, "suggestedDurationMinutes": number}`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    return {
      description: String(parsed.description || ""),
      objective: String(parsed.objective || ""),
      suggestedStakeXrp: Math.min(100, Math.max(1, Number(parsed.suggestedStakeXrp) || 10)),
      suggestedDurationMinutes: Math.min(120, Math.max(5, Number(parsed.suggestedDurationMinutes) || 20)),
    };
  } catch (e) {
    console.error("Gemini expand error:", e);
    return {
      description: `Complete the "${title}" challenge and submit photo proof.`,
      objective: `Take a clear photo proving you completed: ${title}`,
      suggestedStakeXrp: 10,
      suggestedDurationMinutes: 20,
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

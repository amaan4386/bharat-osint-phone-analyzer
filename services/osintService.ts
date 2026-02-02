
import { GoogleGenAI, Type } from "@google/genai";
import { OsintResult, RiskLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePhoneNumber = async (phoneNumber: string): Promise<OsintResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a simulated OSINT analysis on the Indian phone number: ${phoneNumber}. 
      Provide telecom details (Operator, Circle), risk assessment, and a list of potential public data sources where such a number might be found (e.g. business directories, leaked databases, social footprints). 
      This is for educational/ethical OSINT demonstration.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            phoneNumber: { type: Type.STRING },
            country: { type: Type.STRING },
            operator: { type: Type.STRING },
            circle: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: Object.values(RiskLevel) },
            confidenceScore: { type: Type.NUMBER },
            isValid: { type: Type.BOOLEAN },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  timestamp: { type: Type.STRING },
                  severity: { type: Type.STRING }
                }
              }
            },
            metadata: {
              type: Type.OBJECT,
              properties: {
                connectionType: { type: Type.STRING },
                isDND: { type: Type.BOOLEAN },
                potentialOwnerType: { type: Type.STRING }
              }
            }
          },
          required: ["phoneNumber", "operator", "circle", "riskLevel", "findings"]
        }
      }
    });

    const result: OsintResult = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error("Unable to reach OSINT intelligence servers. Check your connection.");
  }
};

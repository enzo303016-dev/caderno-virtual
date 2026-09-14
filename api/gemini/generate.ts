import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGeminiRequest } from '../../src/server/geminiHandler';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const result = await handleGeminiRequest(request.body);
    return response.status(200).json(result);
  } catch (error: any) {
    console.error("Gemini API Error (Vercel):", error);
    return response.status(500).json({ error: error.message || "Internal Server Error" });
  }
}

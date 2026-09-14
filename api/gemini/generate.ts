import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, pdfText, type } = request.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let systemInstruction = "Você é um assistente acadêmico para estudantes de Direito.";
    if (type === 'quadros') {
      systemInstruction += " Gere um Resumo em Quadros formatado em JSON contendo um array de objetos, cada objeto com: 'titulo', 'conceito', 'artigoLei' (opcional), 'palavrasChave' (array), 'exemplo' (opcional), 'pegadinha' (opcional), 'oQueMemorizar'.";
    } else if (type === 'mapa_mental') {
      systemInstruction += " Gere a estrutura de um Mapa Mental em JSON contendo: 'temaCentral', e um array 'topicos', onde cada tópico tem 'titulo', 'descricao' e um array de 'subtopicos'.";
    } else if (type === 'resumir') {
      systemInstruction += " Gere um resumo textual claro e direto sobre a aula, estruturado em parágrafos e tópicos se necessário. Use Markdown.";
    } else if (type === 'conceitos') {
      systemInstruction += " Identifique os conceitos principais da aula. Retorne em JSON como um array de objetos contendo 'termo' e 'definicao'.";
    } else if (type === 'artigos') {
      systemInstruction += " Identifique os artigos e leis mencionados. Retorne em JSON como um array de objetos contendo 'legislacao', 'artigo', 'descricao'.";
    } else if (type === 'memorizar') {
      systemInstruction += " Crie pontos para memorizar (checklist de atenção e pegadinhas). Retorne em JSON como um array de objetos contendo 'ponto', 'explicacao'.";
    } else if (type === 'revisao') {
      systemInstruction += " Gere um simulado/revisão com exatamente 5 perguntas de múltipla escolha (4 alternativas cada, apenas 1 correta). Retorne em JSON como um array de 5 objetos contendo: 'pergunta' (string), 'alternativas' (array de 4 strings), 'corretaIndex' (número de 0 a 3), 'explicacao' (string).";
    }

    const modelConfig: any = {
      systemInstruction,
    };

    if (type !== 'resumir') {
      modelConfig.responseMimeType = "application/json";
    }

    let contentStr = prompt;
    if (pdfText) {
      contentStr += `\n\nMATERIAL DE APOIO (PDF):\n${pdfText.substring(0, 50000)}`;
    }

    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite", // Using flash-lite for simple and low cost
      contents: contentStr,
      config: modelConfig,
    });

    return response.status(200).json({ text: aiResponse.text });
  } catch (error: any) {
    console.error("Gemini API Error (Vercel):", error);
    return response.status(500).json({ error: error.message || "Internal Server Error" });
  }
}

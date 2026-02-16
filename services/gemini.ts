import { GoogleGenAI } from "@google/genai";

// Fix: Initializing Gemini API following high-quality SDK guidelines.
// Always use the named parameter apiKey and obtain it from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Chat interativo com a assistente virtual 'Muse'.
 * Utiliza o modelo gemini-3-flash-preview para respostas rápidas e eficientes sobre gestão e estilo.
 */
export const chatWithMuse = async (prompt: string) => {
  if (!prompt) return undefined;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Você é a 'Muse', a alma inteligente da Domme Lash. Você assessora a Master Lash em questões de estilo, técnica de extensão de cílios e atendimento de luxo. Seu tom é sofisticado, encorajador e profissional.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "O sistema de inteligência está processando dados exclusivos. Tente novamente em breve.";
  }
};

/**
 * Sugestão de Lash Mapping personalizado baseada nos dados da cliente.
 * Utiliza o modelo gemini-3-pro-preview para análise técnica detalhada e raciocínio complexo.
 */
export const getLashMappingSuggestion = async (clientData: any) => {
  if (!clientData) return null;

  try {
    const prompt = `Como especialista em Lash Design da Domme Lash Elite, analise o perfil desta cliente e sugira um mapping ideal:
    Nome: ${clientData.name}
    Formato do Olhar: ${clientData.eyeShape}
    Preferências e Notas: ${clientData.notes}
    
    A sugestão deve ser técnica e sofisticada, incluindo: técnica recomendada, curvaturas, espessuras e justificativa estética.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "Você é uma Senior Lash Master da Domme Lash. Suas recomendações são referências mundiais em sofisticação e saúde ocular.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Mapping Error:", error);
    return "A análise técnica automatizada está temporariamente indisponível no momento.";
  }
};

import { GoogleGenAI, Modality } from "@google/genai";
import { ImageMimeType } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const callGemini = async (parts: any[], model: string = 'gemini-2.5-flash-image') => {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts,
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    if (response.promptFeedback?.blockReason) {
      let reason = `Motivo: ${response.promptFeedback.blockReason}.`;
      if (response.promptFeedback.safetyRatings && response.promptFeedback.safetyRatings.length > 0) {
          reason += ` Detalhes: ${response.promptFeedback.safetyRatings.map(r => `${r.category.replace('HARM_CATEGORY_', '')} (${r.probability})`).join(', ')}`;
      }
      throw new Error(`A imagem não pôde ser gerada devido às políticas de segurança. ${reason}`);
    }

    const candidate = response.candidates?.[0];
    
    if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error("A IA retornou uma resposta vazia. Isso pode ser um problema temporário ou o conteúdo enviado pode ter sido considerado inadequado. Tente simplificar a descrição ou usar outra imagem.");
    }

    const imagePart = candidate.content.parts.find(part => part.inlineData);
    if (imagePart?.inlineData) {
      const base64ImageBytes: string = imagePart.inlineData.data;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    
    try {
        const textResponse = response.text;
        if (textResponse && textResponse.trim()) {
            throw new Error(`A IA retornou um texto em vez de uma imagem: "${textResponse.trim()}"`);
        }
    } catch (e) {
      console.warn("Não foi possível acessar a propriedade 'text' da resposta.", e);
    }

    throw new Error("A IA não retornou uma imagem. Tente novamente com uma imagem ou prompt diferente.");
}


export const generateModelImage = async (
  clothingBase64: string,
  mimeType: ImageMimeType,
  prompt: string,
  background: 'estúdio' | 'loja' | 'jardim' | 'custom',
  keepAuxiliaryLook: boolean,
  customBackground?: string,
  baseModelBase64?: string
): Promise<string> => {
  try {
    let sceneryDescription = '';
    if (background === 'custom' && customBackground) {
        sceneryDescription = customBackground;
    } else {
        switch (background) {
        case 'loja':
            sceneryDescription = 'no interior de uma loja de roupas chique e moderna';
            break;
        case 'jardim':
            sceneryDescription = 'em um jardim exuberante com luz natural';
            break;
        case 'estúdio':
        default:
            sceneryDescription = 'em um fundo de estúdio fotográfico profissional branco';
            break;
        }
    }
    
    const parts: any[] = [];
    let finalPrompt: string;

    if (baseModelBase64) {
      // Tarefa mais complexa: Manter a modelo e trocar a roupa + pose
      parts.push({ inlineData: { data: baseModelBase64, mimeType: 'image/png' } });
      parts.push({ inlineData: { data: clothingBase64, mimeType: mimeType } });

      const lookText = keepAuxiliaryLook 
        ? "Manter as outras peças de roupa da modelo original (sapatos, calças, etc.)." 
        : "Criar um novo look complementar (sapatos, calças, etc.) que combine com a nova peça de roupa.";

      finalPrompt = `
INSTRUÇÃO: Use a primeira imagem como referência para a modelo e a segunda imagem como referência para a peça de roupa.

OBJETIVO: Criar uma nova fotografia de moda ultrarrealista.

REGRAS CRÍTICAS:
1.  A MODELO (rosto, cabelo, corpo) na nova imagem deve ser PERFEITAMENTE IDÊNTICA à modelo da primeira imagem.
2.  A PEÇA DE ROUPA na nova imagem deve ser a peça de roupa da segunda imagem, vestida de forma natural na modelo.
3.  A NOVA POSE da modelo é: "${prompt}".
4.  O CENÁRIO é: "${sceneryDescription}".
5.  LOOK AUXILIAR: ${lookText}

Não altere o rosto ou características da modelo da primeira imagem sob nenhuma circunstância. O resultado deve ser uma foto da mesma mulher, com a roupa nova, na pose e cenário descritos.
`;
      parts.push({ text: finalPrompt });

    } else {
      // Tarefa mais simples: Gerar uma nova modelo com a roupa
       parts.push({
        inlineData: {
          data: clothingBase64,
          mimeType: mimeType,
        },
      });
      
      const lookText = keepAuxiliaryLook
        ? "As peças de roupa auxiliares (calças, sapatos, etc.) devem ser consistentes e formar um look coeso."
        : "A IA deve sugerir novas peças de roupa auxiliares (calças, sapatos, etc.) que combinem com a peça principal.";

      finalPrompt = `
Gere uma fotografia de moda ultrarrealista.

CONTEÚDO DA IMAGEM:
-   MODELO: Uma modelo de corpo inteiro com a seguinte descrição: "${prompt}".
-   ROUPA: A modelo deve estar vestindo a peça de roupa da imagem fornecida.
-   CENÁRIO: ${sceneryDescription}.
-   LOOK AUXILIAR: ${lookText}
`;
      parts.push({ text: finalPrompt });
    }

    return await callGemini(parts);

  } catch (error) {
    console.error("Error calling Gemini API for image generation:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Falha ao se comunicar com a IA para gerar imagem. Verifique sua conexão ou tente novamente mais tarde.");
  }
};

export const changeAuxiliaryLook = async (
    generatedImageBase64: string
): Promise<string> => {
    try {
        const parts: any[] = [];
        parts.push({
            inlineData: { data: generatedImageBase64, mimeType: 'image/png' }
        });
        
        const prompt = `
INSTRUÇÃO: Edite a imagem de moda fornecida.

REGRAS DA EDIÇÃO:
1.  MUDANÇA PERMITIDA: Altere APENAS as peças de roupa auxiliares (calças, sapatos, saia, acessórios, etc.). Crie um novo look complementar que seja moderno e combine com a peça principal.
2.  NÃO MUDAR (MANTER IDÊNTICO): A modelo (rosto, corpo, cabelo), a peça de roupa principal que ela já está vestindo, a pose e o cenário de fundo.

O resultado deve ser a mesma imagem, mas com um look auxiliar diferente.
`;
        
        parts.push({ text: prompt });

        return await callGemini(parts);

    } catch (error) {
        console.error("Error calling Gemini API for auxiliary look change:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Falha ao se comunicar com a IA para trocar o look. Tente novamente.");
    }
};

export const generateRandomPrompt = async (prompt: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const text = response.text.trim().replace(/"/g, ''); // Remove quotes
        if (!text) {
            throw new Error("A IA retornou uma resposta vazia.");
        }
        return text;
    } catch (error) {
        console.error("Error calling Gemini API for random prompt generation:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Falha ao gerar sugestão da IA.");
    }
};

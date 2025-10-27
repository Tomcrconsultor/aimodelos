
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { GeneratedImage } from './components/GeneratedImage';
import { Button } from './components/Button';
import { generateModelImage, changeAuxiliaryLook } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { imageUrlToBase64 } from './utils/imageUtils';
import { ImageMimeType } from './types';

type BackgroundType = 'estúdio' | 'loja' | 'jardim';
export interface GeneratedImageState {
  url: string;
  isLoading: boolean;
}


const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelPrompt, setModelPrompt] = useState<string>('Uma modelo loira, sorrindo, cabelo solto.');
  const [posePrompt, setPosePrompt] = useState<string>('Pose elegante, de corpo inteiro, olhando para a câmera.');
  const [background, setBackground] = useState<BackgroundType>('estúdio');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageState[]>([]);
  const [baseModelImageUrl, setBaseModelImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [variationCount, setVariationCount] = useState<number>(3);
  const [keepAuxiliaryLook, setKeepAuxiliaryLook] = useState<boolean>(true);


  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleGenerateClick = useCallback(async () => {
    if (!selectedFile) {
      setError('Por favor, selecione uma imagem da peça de roupa.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const { base64: clothingBase64, mimeType } = await fileToBase64(selectedFile);
      
      if (!mimeType || !Object.values(ImageMimeType).includes(mimeType as ImageMimeType)) {
        throw new Error('Tipo de arquivo inválido. Por favor, use PNG, JPEG ou WEBP.');
      }
      
      let baseModelBase64: string | undefined = undefined;
      if(baseModelImageUrl) {
        baseModelBase64 = await imageUrlToBase64(baseModelImageUrl);
      }

      const finalPrompt = baseModelImageUrl ? posePrompt : modelPrompt;
      
      const generationPromises = Array(variationCount).fill(null).map(() => 
        generateModelImage(clothingBase64, mimeType as ImageMimeType, finalPrompt, background, keepAuxiliaryLook, baseModelBase64)
      );

      const results = await Promise.all(generationPromises);
      setGeneratedImages(results.filter(url => url).map(url => ({ url, isLoading: false })));

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao gerar as imagens.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, modelPrompt, posePrompt, background, baseModelImageUrl, variationCount, keepAuxiliaryLook]);
  
  const handleKeepModel = useCallback((url: string) => {
    if(url) {
      setBaseModelImageUrl(url);
      setGeneratedImages([{ url, isLoading: false }]); 
    }
  }, []);

  const handleDiscardModel = () => {
    setBaseModelImageUrl(null);
    setGeneratedImages([]); 
  };

  const handleSwapLook = useCallback(async (imageUrl: string, index: number) => {
    setGeneratedImages(prev => {
        const newImages = [...prev];
        newImages[index].isLoading = true;
        return newImages;
    });
    setError(null);

    try {
        const generatedImageBase64 = await imageUrlToBase64(imageUrl);
        const newImageUrl = await changeAuxiliaryLook(generatedImageBase64);

        setGeneratedImages(prev => {
            const newImages = [...prev];
            newImages[index] = { url: newImageUrl, isLoading: false };
            return newImages;
        });
    } catch (err) {
        console.error("Error swapping auxiliary look:", err);
        setError(err instanceof Error ? err.message : 'Falha ao trocar o look auxiliar.');
         setGeneratedImages(prev => {
            const newImages = [...prev];
            newImages[index].isLoading = false;
            return newImages;
        });
    }
  }, []);


  const backgroundOptions: { id: BackgroundType; label: string; description: string }[] = [
    { id: 'estúdio', label: 'Estúdio', description: '(Fundo Branco)' },
    { id: 'loja', label: 'Loja', description: '(Interior)' },
    { id: 'jardim', label: 'Jardim', description: '(Ar Livre)' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">1. Envie sua peça</h2>
              <p className="text-gray-600">Faça o upload de uma imagem da roupa em um fundo liso para melhores resultados.</p>
            </div>
            <ImageUploader onFileSelect={handleFileSelect} />
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
            <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">2. Customize sua imagem</h2>
                <p className="text-gray-600">Descreva a modelo e o cenário, ou mantenha a modelo e apenas mude a pose.</p>
            </div>

            {baseModelImageUrl && (
                 <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                    <h3 className="text-sm font-bold text-pink-800 mb-2">Modelo Selecionada:</h3>
                    <div className="flex items-center justify-between">
                        <img src={baseModelImageUrl} alt="Modelo base" className="w-16 h-16 rounded-md object-cover"/>
                        <button 
                            onClick={handleDiscardModel}
                            className="text-sm font-semibold text-pink-600 hover:text-pink-800 transition-colors"
                        >
                            Descartar Modelo e Gerar Nova
                        </button>
                    </div>
                </div>
            )}
            
            <div>
              {baseModelImageUrl ? (
                 <>
                    <label htmlFor="pose-prompt-input" className="block text-sm font-medium text-gray-700 mb-1">Nova pose ou ação</label>
                    <textarea
                        id="pose-prompt-input"
                        value={posePrompt}
                        onChange={(e) => setPosePrompt(e.target.value)}
                        placeholder="Ex: Sentada em um banco, com as mãos no bolso..."
                        className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-200 resize-none"
                        disabled={isLoading}
                    />
                 </>
              ) : (
                <>
                  <label htmlFor="model-prompt-input" className="block text-sm font-medium text-gray-700 mb-1">Descrição da modelo</label>
                  <textarea
                      id="model-prompt-input"
                      value={modelPrompt}
                      onChange={(e) => setModelPrompt(e.target.value)}
                      placeholder="Ex: Uma modelo asiática com cabelo curto..."
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-200 resize-none"
                      disabled={isLoading}
                  />
                </>
              )}
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Variações</label>
                <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((count) => (
                        <button
                            key={count}
                            onClick={() => setVariationCount(count)}
                            disabled={isLoading}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${variationCount === count ? 'bg-pink-500 border-pink-500 text-white shadow-md' : 'bg-white border-gray-300 hover:border-pink-400'}`}
                        >
                            {count}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Consistência do Look Auxiliar</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setKeepAuxiliaryLook(true)}
                        disabled={isLoading}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${keepAuxiliaryLook ? 'bg-pink-500 border-pink-500 text-white shadow-md' : 'bg-white border-gray-300 hover:border-pink-400'}`}
                    >
                        Sim
                    </button>
                    <button
                        onClick={() => setKeepAuxiliaryLook(false)}
                        disabled={isLoading}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${!keepAuxiliaryLook ? 'bg-pink-500 border-pink-500 text-white shadow-md' : 'bg-white border-gray-300 hover:border-pink-400'}`}
                    >
                        Não
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    "Sim" mantém calças/sapatos/acessórios iguais. "Não" permite que a IA sugira novos.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cenário</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {backgroundOptions.map(({ id, label, description }) => (
                         <button 
                            key={id}
                            onClick={() => setBackground(id)} 
                            disabled={isLoading}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 text-center disabled:opacity-50 disabled:cursor-not-allowed ${background === id ? 'bg-pink-500 border-pink-500 text-white shadow-md' : 'bg-white border-gray-300 hover:border-pink-400 hover:shadow-sm'}`}>
                            <span className="font-semibold">{label}</span>
                            <span className="text-xs block opacity-80">{description}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <Button
              onClick={handleGenerateClick}
              disabled={!selectedFile || isLoading}
            >
              {isLoading ? `Gerando ${variationCount} Variaç${variationCount > 1 ? 'ões' : 'ão'}...` : `Gerar ${variationCount} Variaç${variationCount > 1 ? 'ões' : 'ão'}`}
            </Button>
          </div>
        </div>

        <div className="mt-8 lg:mt-12">
           <GeneratedImage 
              images={generatedImages}
              isLoading={isLoading}
              error={error}
              onKeepModel={handleKeepModel}
              onSwapLook={handleSwapLook}
              isModelKept={!!baseModelImageUrl}
            />
        </div>

      </main>
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Criado com React, TailwindCSS e Gemini API</p>
      </footer>
    </div>
  );
};

export default App;

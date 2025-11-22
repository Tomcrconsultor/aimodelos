import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { GeneratedImage } from './components/GeneratedImage';
import { Button } from './components/Button';
import { PricingModal } from './components/PricingModal';
import { generateModelImage, changeAuxiliaryLook, generateRandomPrompt } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { imageUrlToBase64 } from './utils/imageUtils';
import { ImageMimeType } from './types';
import { Spinner } from './components/Spinner';


type BackgroundType = 'estúdio' | 'loja' | 'jardim' | 'custom';
export interface GeneratedImageState {
  url: string;
  isLoading: boolean;
}

const MagicWandIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-5 h-5"}>
        <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69a.75.75 0 0 1 .981.981A10.501 10.501 0 0 1 18 16.5a10.5 10.5 0 1 1-10.5-10.5c.351 0 .694.022 1.034.065a.75.75 0 0 1 .819.162Z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M11.54 2.363a.75.75 0 0 1 1.06.04l3 3.5a.75.75 0 0 1-1.1 1.02l-3-3.5a.75.75 0 0 1 .04-1.06ZM16.96 15a.75.75 0 0 1 1.06.04l3 3.5a.75.75 0 1 1-1.1 1.02l-3-3.5a.75.75 0 0 1 .04-1.06Z" clipRule="evenodd" />
    </svg>
);


const App: React.FC = () => {
  // Estado do Usuário / SaaS
  const [credits, setCredits] = useState<number>(2); // Começa com 2 créditos gratuitos
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelPrompt, setModelPrompt] = useState<string>('Uma modelo loira, sorrindo, cabelo solto.');
  const [posePrompt, setPosePrompt] = useState<string>('Pose elegante, de corpo inteiro, olhando para a câmera.');
  const [background, setBackground] = useState<BackgroundType>('estúdio');
  const [customBackgroundPrompt, setCustomBackgroundPrompt] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageState[]>([]);
  const [baseModelImageUrl, setBaseModelImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [variationCount, setVariationCount] = useState<number>(3);
  const [keepAuxiliaryLook, setKeepAuxiliaryLook] = useState<boolean>(true);
  const [isGeneratingModelDesc, setIsGeneratingModelDesc] = useState(false);
  const [isGeneratingBgDesc, setIsGeneratingBgDesc] = useState(false);
  const [isGeneratingPoseDesc, setIsGeneratingPoseDesc] = useState(false);


  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setError(null);
  };

  const handlePurchaseSuccess = (newCredits: number) => {
      setCredits(prev => prev + newCredits);
  };

  const handleGenerateClick = useCallback(async () => {
    // SaaS: Verificação de créditos
    if (credits < variationCount) {
        setIsPricingOpen(true);
        return;
    }

    if (!selectedFile) {
      setError('Por favor, selecione uma imagem da peça de roupa.');
      return;
    }
    if (background === 'custom' && !customBackgroundPrompt.trim()) {
        setError('Por favor, descreva o cenário customizado.');
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
        generateModelImage(clothingBase64, mimeType as ImageMimeType, finalPrompt, background, keepAuxiliaryLook, background === 'custom' ? customBackgroundPrompt : undefined, baseModelBase64)
      );

      const results = await Promise.all(generationPromises);
      
      // SaaS: Deduzir créditos apenas se sucesso
      setCredits(prev => Math.max(0, prev - variationCount));
      
      setGeneratedImages(results.filter(url => url).map(url => ({ url, isLoading: false })));

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao gerar as imagens.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, modelPrompt, posePrompt, background, customBackgroundPrompt, baseModelImageUrl, variationCount, keepAuxiliaryLook, credits]);
  
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
    if (credits < 1) {
        setIsPricingOpen(true);
        return;
    }

    setGeneratedImages(prev => {
        const newImages = [...prev];
        newImages[index].isLoading = true;
        return newImages;
    });
    setError(null);

    try {
        const generatedImageBase64 = await imageUrlToBase64(imageUrl);
        const newImageUrl = await changeAuxiliaryLook(generatedImageBase64);
        
        // SaaS: Deduzir crédito por edição
        setCredits(prev => Math.max(0, prev - 1));

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
  }, [credits]);
  
  const handleGenerateModelDesc = useCallback(async () => {
    setIsGeneratingModelDesc(true);
    setError(null);
    try {
        const prompt = "Gere uma descrição detalhada de uma modelo para fotografia de moda, incluindo etnia, cor e estilo do cabelo, e expressão facial (ex: sorrindo). Responda APENAS com a descrição, sem texto extra. Máximo de 150 caracteres.";
        const description = await generateRandomPrompt(prompt);
        setModelPrompt(description);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao gerar descrição.');
    } finally {
        setIsGeneratingModelDesc(false);
    }
  }, []);

  const handleGenerateBgDesc = useCallback(async () => {
    setIsGeneratingBgDesc(true);
    setError(null);
    try {
        const prompt = "Gere uma descrição de cenário para fotografia de moda. Responda APENAS com a descrição, sem texto extra. Máximo de 100 caracteres.";
        const description = await generateRandomPrompt(prompt);
        setCustomBackgroundPrompt(description);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao gerar cenário.');
    } finally {
        setIsGeneratingBgDesc(false);
    }
  }, []);

  const handleGeneratePoseDesc = useCallback(async () => {
    setIsGeneratingPoseDesc(true);
    setError(null);
    try {
        const prompt = "Gere uma descrição de uma pose ou ação para uma modelo em uma fotografia de moda. Responda APENAS com a descrição, sem texto extra. Máximo de 100 caracteres.";
        const description = await generateRandomPrompt(prompt);
        setPosePrompt(description);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao gerar pose.');
    } finally {
        setIsGeneratingPoseDesc(false);
    }
  }, []);


  const backgroundOptions: { id: BackgroundType; label: string; description: string }[] = [
    { id: 'estúdio', label: 'Estúdio', description: '(Fundo Branco)' },
    { id: 'loja', label: 'Loja', description: '(Interior)' },
    { id: 'jardim', label: 'Jardim', description: '(Ar Livre)' },
    { id: 'custom', label: 'Custom', description: '(Descreva o seu)' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header credits={credits} onOpenPricing={() => setIsPricingOpen(true)} />
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} onPurchaseSuccess={handlePurchaseSuccess} />
      
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
            
            <div className="relative">
              {baseModelImageUrl ? (
                 <div className="relative">
                    <label htmlFor="pose-prompt-input" className="block text-sm font-medium text-gray-700 mb-1">Nova pose ou ação</label>
                    <textarea
                        id="pose-prompt-input"
                        value={posePrompt}
                        onChange={(e) => setPosePrompt(e.target.value)}
                        placeholder="Ex: Sentada em um banco, com as mãos no bolso..."
                        className="w-full h-24 p-3 pr-12 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-200 resize-none text-white placeholder-gray-400"
                        disabled={isLoading || isGeneratingPoseDesc}
                    />
                    <button
                        onClick={handleGeneratePoseDesc}
                        disabled={isLoading || isGeneratingPoseDesc}
                        className="absolute bottom-3 right-3 flex items-center justify-center w-8 h-8 bg-pink-500 text-white rounded-full shadow-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 transition-all duration-200 ease-in-out transform hover:scale-110 disabled:bg-gray-500 disabled:scale-100 disabled:cursor-wait"
                        title="Gerar sugestão de pose com IA"
                    >
                        {isGeneratingPoseDesc ? <Spinner className="animate-spin h-5 w-5 text-white" /> : <MagicWandIcon className="w-5 h-5" />}
                    </button>
                 </div>
              ) : (
                <>
                  <label htmlFor="model-prompt-input" className="block text-sm font-medium text-gray-700 mb-1">Descrição da modelo</label>
                  <textarea
                      id="model-prompt-input"
                      value={modelPrompt}
                      onChange={(e) => setModelPrompt(e.target.value)}
                      placeholder="Ex: Uma modelo asiática com cabelo curto..."
                      className="w-full h-24 p-3 pr-12 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-200 resize-none text-white placeholder-gray-400"
                      disabled={isLoading || isGeneratingModelDesc}
                  />
                   <button
                        onClick={handleGenerateModelDesc}
                        disabled={isLoading || isGeneratingModelDesc}
                        className="absolute bottom-3 right-3 flex items-center justify-center w-8 h-8 bg-pink-500 text-white rounded-full shadow-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 transition-all duration-200 ease-in-out transform hover:scale-110 disabled:bg-gray-500 disabled:scale-100 disabled:cursor-wait"
                        title="Gerar descrição de modelo com IA"
                    >
                        {isGeneratingModelDesc ? <Spinner className="animate-spin h-5 w-5 text-white" /> : <MagicWandIcon className="w-5 h-5" />}
                    </button>
                </>
              )}
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Variações <span className="text-xs text-gray-500 font-normal">(1 crédito por foto)</span></label>
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

            {variationCount > 1 && (
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
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cenário</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {backgroundOptions.map(({ id, label }) => (
                         <button 
                            key={id}
                            onClick={() => setBackground(id)} 
                            disabled={isLoading}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 text-center disabled:opacity-50 disabled:cursor-not-allowed ${background === id ? 'bg-pink-500 border-pink-500 text-white shadow-md' : 'bg-white border-gray-300 hover:border-pink-400 hover:shadow-sm'}`}>
                            <span className="font-semibold text-sm">{label}</span>
                        </button>
                    ))}
                </div>

                {background === 'custom' && (
                    <div className="relative mt-4">
                        <label htmlFor="custom-background-prompt" className="block text-sm font-medium text-gray-700 mb-1">Descreva o cenário</label>
                         <textarea
                            id="custom-background-prompt"
                            value={customBackgroundPrompt}
                            onChange={(e) => setCustomBackgroundPrompt(e.target.value)}
                            placeholder="Ex: Em uma praia ensolarada no Rio de Janeiro..."
                            className="w-full h-24 p-3 pr-12 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-200 resize-none text-white placeholder-gray-400"
                            disabled={isLoading || isGeneratingBgDesc}
                        />
                        <button
                            onClick={handleGenerateBgDesc}
                            disabled={isLoading || isGeneratingBgDesc}
                            className="absolute bottom-3 right-3 flex items-center justify-center w-8 h-8 bg-pink-500 text-white rounded-full shadow-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 transition-all duration-200 ease-in-out transform hover:scale-110 disabled:bg-gray-500 disabled:scale-100 disabled:cursor-wait"
                            title="Gerar descrição de cenário com IA"
                        >
                            {isGeneratingBgDesc ? <Spinner className="animate-spin h-5 w-5 text-white" /> : <MagicWandIcon className="w-5 h-5" />}
                        </button>
                    </div>
                )}
            </div>
            
            <div className="space-y-2">
                <Button
                onClick={handleGenerateClick}
                disabled={!selectedFile || isLoading}
                >
                {isLoading ? `Gerando ${variationCount} Variaç${variationCount > 1 ? 'ões' : 'ão'}...` : `Gerar ${variationCount} Variaç${variationCount > 1 ? 'ões' : 'ão'} (-${variationCount} créditos)`}
                </Button>
                 {credits < variationCount && (
                     <p className="text-red-500 text-sm text-center">Saldo insuficiente. <button onClick={() => setIsPricingOpen(true)} className="underline font-bold">Recarregar agora</button></p>
                 )}
            </div>
          </div>
        </div>

        <div className="mt-8 lg:mt-12">
           {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg text-center p-4">
                <p className="text-sm text-red-700">{error}</p>
            </div>
           )}
           <GeneratedImage 
              images={generatedImages}
              isLoading={isLoading}
              error={null}
              onKeepModel={handleKeepModel}
              onSwapLook={handleSwapLook}
              isModelKept={!!baseModelImageUrl}
            />
        </div>

      </main>
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Provador Virtual SaaS &copy; 2024 - Pagamentos seguros via Mercado Pago</p>
      </footer>
    </div>
  );
};

export default App;
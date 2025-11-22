
import React from 'react';
import { Spinner } from './Spinner';
import { GeneratedImageState } from '../App';

interface GeneratedImageProps {
  images: GeneratedImageState[];
  isLoading: boolean;
  error: string | null;
  onKeepModel: (url: string) => void;
  onSwapLook: (url: string, index: number) => void;
  isModelKept: boolean;
}

const Placeholder: React.FC = () => (
    <div className="w-full aspect-square bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-center p-8 border border-gray-200">
      <svg className="w-16 h-16 text-gray-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 className="text-lg font-semibold text-gray-500">Suas imagens geradas aparecerão aqui</h3>
      <p className="text-sm text-gray-400 mt-1">Envie uma peça e descreva sua modelo para começar.</p>
    </div>
);

export const GeneratedImage: React.FC<GeneratedImageProps> = ({ images, isLoading, error, onKeepModel, onSwapLook, isModelKept }) => {
  const handleDownload = (url: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo-gerada-ia.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGridClass = () => {
    switch (images.length) {
      case 1:
        return 'md:grid-cols-1 max-w-lg mx-auto';
      case 2:
      case 4:
        return 'md:grid-cols-2';
      case 3:
      default:
        return 'md:grid-cols-3';
    }
  };
  
  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-2xl flex flex-col items-center justify-center text-center p-8 shadow-lg border border-gray-100 min-h-[300px]">
        <Spinner />
        <h3 className="text-lg font-semibold text-gray-700 mt-4">A IA está criando suas imagens...</h3>
        <p className="text-sm text-gray-500 mt-1">Isso pode levar alguns instantes.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-2xl flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
         <svg className="w-16 h-16 text-red-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-red-700">Ocorreu um Erro</h3>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (images.length > 0) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6">
        <h3 className="text-xl font-bold text-center text-gray-800">
          {isModelKept ? 'Pose Gerada' : 'Resultados Gerados - Escolha uma modelo'}
        </h3>
        <div className={`grid grid-cols-1 ${getGridClass()} gap-4`}>
          {images.map(({ url, isLoading: isImageLoading }, index) => (
            <div key={index} className="space-y-3">
              <div className="relative group">
                <img src={url} alt={`Modelo gerada por IA ${index + 1}`} className="w-full h-auto rounded-lg" />
                 {isImageLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <Spinner />
                    </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center rounded-lg">
                  <button
                    onClick={() => handleDownload(url)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-gray-800 font-bold py-2 px-4 rounded-full shadow-lg hover:bg-gray-100"
                  >
                    Baixar Imagem
                  </button>
                </div>
              </div>
              <div className={`grid ${isModelKept ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                {!isModelKept && (
                    <button
                        onClick={() => onKeepModel(url)}
                        disabled={isImageLoading}
                        className="w-full bg-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-300 disabled:bg-gray-300"
                    >
                        Manter Modelo
                    </button>
                )}
                <button
                    onClick={() => onSwapLook(url, index)}
                    disabled={isImageLoading}
                    className="w-full bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300 disabled:bg-gray-400"
                >
                    {isImageLoading ? 'Trocando...' : 'Trocar Look Auxiliar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <Placeholder />;
};

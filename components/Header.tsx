import React from 'react';

interface HeaderProps {
    credits: number;
    onOpenPricing: () => void;
}

export const Header: React.FC<HeaderProps> = ({ credits, onOpenPricing }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Provador Virtual <span className="text-pink-500">Pro</span>
            </h1>
        </div>

        <div className="flex items-center gap-4">
            <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2 border border-gray-200">
                <span className="text-sm font-medium text-gray-600">Créditos:</span>
                <span className={`font-bold ${credits === 0 ? 'text-red-500' : 'text-gray-900'}`}>{credits}</span>
            </div>
            <button 
                onClick={onOpenPricing}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-bold py-2 px-4 rounded-full hover:from-pink-600 hover:to-purple-700 transition-all shadow-md flex items-center gap-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Recarregar
            </button>
        </div>
      </div>
    </header>
  );
};
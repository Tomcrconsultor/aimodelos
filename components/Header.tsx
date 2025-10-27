
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-6 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          Provador Virtual com <span className="text-pink-500">IA</span>
        </h1>
        <p className="mt-2 text-md md:text-lg text-gray-600 max-w-2xl mx-auto">
          Transforme fotos de produtos em imagens de modelos profissionais para sua loja online.
        </p>
      </div>
    </header>
  );
};


import React, { useState, useRef, useCallback } from 'react';

interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
}

const UploadIcon: React.FC = () => (
  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
    onFileSelect(file);
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] || null;
    if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        if(file) dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
    }
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
    onFileSelect(file);
  }, [onFileSelect]);


  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      {preview ? (
        <div className="relative group">
          <img src={preview} alt="Pré-visualização da roupa" className="w-full h-auto rounded-lg object-contain max-h-96" />
          <div 
            onClick={openFileDialog}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer rounded-lg">
            Trocar Imagem
          </div>
        </div>
      ) : (
        <label 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFileDialog}
          className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-pink-400 transition-colors duration-200">
          <div className="space-y-1 text-center">
            <UploadIcon />
            <div className="flex text-sm text-gray-600">
              <span className="relative bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-pink-500">
                <span>Carregue um arquivo</span>
              </span>
              <p className="pl-1">ou arraste e solte</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP até 10MB</p>
          </div>
        </label>
      )}
    </div>
  );
};

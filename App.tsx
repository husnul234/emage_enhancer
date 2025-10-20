import React, { useState, useCallback, useMemo } from 'react';
import { ImageFile, ImageFileStatus } from './types';
import { enhanceImage } from './services/geminiService';
import { ImageCard } from './components/ImageCard';
import { UploadIcon, SparklesIcon, DownloadIcon } from './components/Icons';

declare const JSZip: any;

const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const fileToBase64 = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};


const App: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = async (files: FileList | null) => {
    if (!files) return;
    const newImageFiles: ImageFile[] = [];
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const dataUrl = await fileToDataURL(file);
        newImageFiles.push({
          id: `${file.name}-${Date.now()}`,
          file,
          originalSrc: dataUrl,
          enhancedSrc: null,
          status: ImageFileStatus.IDLE,
        });
      }
    }
    setImages(prev => [...prev, ...newImageFiles]);
  };
  
  const enhanceSingleImage = async (id: string) => {
    const imageToEnhance = images.find(img => img.id === id);
    if (!imageToEnhance) return;

    setImages(prev => prev.map(img => img.id === id ? { ...img, status: ImageFileStatus.ENHANCING } : img));

    try {
      const base64 = fileToBase64(imageToEnhance.originalSrc);
      const enhancedBase64 = await enhanceImage(base64, imageToEnhance.file.type);
      const enhancedSrc = `data:${imageToEnhance.file.type};base64,${enhancedBase64}`;
      setImages(prev => prev.map(img => img.id === id ? { ...img, status: ImageFileStatus.SUCCESS, enhancedSrc } : img));
    } catch (error) {
      console.error('Enhancement failed for', imageToEnhance.file.name, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setImages(prev => prev.map(img => img.id === id ? { ...img, status: ImageFileStatus.ERROR, error: errorMessage } : img));
    }
  };

  const enhanceAllImages = async () => {
    setIsProcessing(true);
    const idleImages = images.filter(img => img.status === ImageFileStatus.IDLE);
    for (const image of idleImages) {
        await enhanceSingleImage(image.id);
    }
    setIsProcessing(false);
  };

  const handleDownloadAll = async () => {
    const successfulImages = images.filter(
      (img) => img.status === ImageFileStatus.SUCCESS && img.enhancedSrc
    );
    if (successfulImages.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const image of successfulImages) {
        if (!image.enhancedSrc) continue;
        const response = await fetch(image.enhancedSrc);
        const blob = await response.blob();
        
        const originalName = image.file.name.split('.').slice(0, -1).join('.');
        let extension = image.file.type.split('/')[1] || 'png';
        if (extension === 'jpeg') extension = 'jpg';
        
        zip.file(`${originalName}-enhanced.${extension}`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'enhanced-images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error("Failed to create zip file", error);
        // Here you could set an error state to show a message to the user
    } finally {
        setIsZipping(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileChange(e.dataTransfer.files);
        e.dataTransfer.clearData();
    }
  };

  const idleImageCount = useMemo(() => images.filter(img => img.status === ImageFileStatus.IDLE).length, [images]);
  const successfulImageCount = useMemo(() => images.filter(img => img.status === ImageFileStatus.SUCCESS).length, [images]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-2">
            <SparklesIcon className="w-12 h-12 text-cyan-400" />
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
              Gemini Image Enhancer
            </h1>
          </div>
          <p className="text-lg text-gray-400">
            Transform blurry images into sharp, high-definition masterpieces.
          </p>
        </header>

        <main>
          <div className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl p-8 mb-8 text-center">
            <label 
                htmlFor="file-upload" 
                className={`relative block w-full cursor-pointer transition-all duration-300 ${dragOver ? 'border-cyan-400 scale-105' : 'border-gray-600'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center p-6">
                <UploadIcon className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-xl font-semibold text-gray-200">Drag & drop your images here</p>
                <p className="text-gray-400">or click to browse</p>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files)}
                />
              </div>
            </label>
            {images.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4 flex-wrap">
                     <p className="text-gray-300 text-center sm:text-left w-full sm:w-auto mb-4 sm:mb-0">
                        {images.length} image{images.length > 1 ? 's' : ''} loaded. {idleImageCount} to enhance, {successfulImageCount} completed.
                     </p>
                     <div className="flex gap-4">
                        <button
                            onClick={enhanceAllImages}
                            disabled={isProcessing || idleImageCount === 0}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                            >
                            {isProcessing ? 'Processing...' : `Enhance All (${idleImageCount})`}
                            <SparklesIcon className="w-5 h-5"/>
                        </button>
                        <button
                            onClick={handleDownloadAll}
                            disabled={isZipping || successfulImageCount === 0}
                            className="flex items-center justify-center gap-2 bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-gray-500/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                            >
                            {isZipping ? 'Zipping...' : `Download All (${successfulImageCount})`}
                            <DownloadIcon className="w-5 h-5"/>
                        </button>
                     </div>
                </div>
            )}
          </div>
          
          {images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {images.map(image => (
                <ImageCard key={image.id} image={image} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
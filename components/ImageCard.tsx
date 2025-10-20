import React, { useState } from 'react';
import { ImageFile, ImageFileStatus } from '../types';
import { DownloadIcon } from './Icons';

interface ImageCardProps {
  image: ImageFile;
}

const Spinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
    </div>
);

const StatusBadge: React.FC<{ status: ImageFileStatus }> = ({ status }) => {
  const statusColors: Record<ImageFileStatus, string> = {
    [ImageFileStatus.IDLE]: 'bg-gray-500',
    [ImageFileStatus.ENHANCING]: 'bg-blue-500 animate-pulse',
    [ImageFileStatus.SUCCESS]: 'bg-green-500',
    [ImageFileStatus.ERROR]: 'bg-red-500',
  };
  return (
    <span className={`absolute top-2 right-2 text-xs font-semibold px-2.5 py-1 rounded-full text-white ${statusColors[status]} z-20`}>
      {status}
    </span>
  );
};

export const ImageCard: React.FC<ImageCardProps> = ({ image }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
    
  const handleDownload = () => {
    if (!image.enhancedSrc) return;
    const link = document.createElement('a');
    link.href = image.enhancedSrc;
    const originalName = image.file.name.split('.').slice(0, -1).join('.');
    
    let extension = image.file.type.split('/')[1] || 'png';
    if (extension === 'jpeg') extension = 'jpg';

    link.download = `${originalName}-enhanced.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    
  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden relative transform transition-transform duration-300 hover:scale-105 hover:shadow-cyan-500/20">
      <StatusBadge status={image.status} />
      
      {image.status === ImageFileStatus.SUCCESS && image.enhancedSrc ? (
        <div className="p-4">
          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-sm font-bold text-gray-400">Original</h3>
            <h3 className="text-sm font-bold text-gray-400">Enhanced</h3>
          </div>
          <div className="relative aspect-square w-full rounded-lg overflow-hidden group select-none" style={{ cursor: 'ew-resize' }}>
            <img 
              src={image.originalSrc} 
              alt="Original" 
              className="absolute inset-0 w-full h-full object-cover" 
              draggable="false"
            />
            
            <div
              className="absolute inset-0 w-full h-full"
              style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
            >
              <img 
                src={image.enhancedSrc} 
                alt="Enhanced" 
                className="absolute inset-0 w-full h-full object-cover" 
                draggable="false"
              />
            </div>

            <div
              className="absolute top-0 bottom-0 w-1 bg-white/75 backdrop-blur-sm pointer-events-none transition-colors duration-200 group-hover:bg-cyan-400"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full h-10 w-10 flex items-center justify-center shadow-2xl transition-transform duration-200 group-hover:scale-110 group-hover:bg-cyan-400">
                <svg className="w-6 h-6 text-gray-600 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 w-full h-full cursor-ew-resize appearance-none bg-transparent focus:outline-none"
              aria-label="Image comparison slider"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div>
            <h3 className="text-lg font-bold text-gray-300 mb-2 text-center">Original</h3>
            <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={image.originalSrc} alt="Original" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-300 mb-2 text-center">Enhanced</h3>
            <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
              {image.status === ImageFileStatus.ENHANCING && <Spinner />}
              {image.status === ImageFileStatus.ERROR && (
                <div className="text-center text-red-400 p-2 text-sm break-words">
                  <p className="font-bold">Enhancement Failed</p>
                  <p>{image.error}</p>
                </div>
              )}
               {(image.status === ImageFileStatus.IDLE) && (
                  <div className="text-center text-gray-400 p-2">
                      <p>Ready to enhance</p>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 pt-0">
          <p className="text-sm text-gray-400 truncate" title={image.file.name}>{image.file.name}</p>
          {image.status === ImageFileStatus.SUCCESS && (
              <button
                onClick={handleDownload}
                className="w-full mt-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <DownloadIcon className="w-5 h-5" />
                Download
              </button>
            )}
      </div>
    </div>
  );
};
import React, { useState, useCallback } from 'react';
import { DropArea } from './components/DropArea';
import { Button } from './components/Button';
import { ImageItem, ConversionStatus } from './types';
import { convertPngToJpg, formatBytes } from './utils/imageConverter';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  const handleFilesSelected = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    const newImages: ImageItem[] = Array.from(fileList)
      .filter(file => file.type === 'image/png')
      .map(file => ({
        id: Math.random().toString(36).substring(7),
        originalFile: file,
        previewUrl: URL.createObjectURL(file),
        convertedUrl: null,
        status: ConversionStatus.IDLE,
        originalSize: file.size
      }));

    if (newImages.length === 0) {
      alert("Por favor selecciona solo archivos PNG.");
      return;
    }

    setImages(prev => [...prev, ...newImages]);
  }, []);

  const convertImage = async (id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, status: ConversionStatus.CONVERTING } : img));
    
    const imageToConvert = images.find(img => img.id === id);
    if (!imageToConvert) return;

    try {
      const blob = await convertPngToJpg(imageToConvert.originalFile);
      const url = URL.createObjectURL(blob);
      
      setImages(prev => prev.map(img => img.id === id ? { 
        ...img, 
        status: ConversionStatus.COMPLETED,
        convertedUrl: url,
        convertedSize: blob.size
      } : img));
    } catch (error) {
      console.error(error);
      setImages(prev => prev.map(img => img.id === id ? { ...img, status: ConversionStatus.ERROR } : img));
    }
  };

  const convertAll = async () => {
    setGlobalLoading(true);
    const pendingImages = images.filter(img => img.status === ConversionStatus.IDLE);
    
    await Promise.all(pendingImages.map(img => convertImage(img.id)));
    setGlobalLoading(false);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.previewUrl);
        if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const downloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.png', '.jpg');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto">
      <header className="mb-10 text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
          PNG a JPG
        </h1>
        <p className="text-slate-400 text-lg">
          Convierte tus imágenes al instante sin perder calidad visual.
        </p>
      </header>

      <main className="space-y-8">
        <DropArea onFilesSelected={handleFilesSelected} />

        {images.length > 0 && (
          <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-200">
                Tus Imágenes ({images.length})
              </h2>
              {images.some(img => img.status === ConversionStatus.IDLE) && (
                <Button 
                  onClick={convertAll} 
                  isLoading={globalLoading}
                  className="bg-indigo-600 hover:bg-indigo-500"
                >
                  Convertir Todo
                </Button>
              )}
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {images.map((img) => (
                <div key={img.id} className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden group hover:border-indigo-500/50 transition-colors">
                  {/* Remove button */}
                  <button 
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Eliminar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>

                  <div className="aspect-video bg-slate-950 relative">
                    <img 
                      src={img.convertedUrl || img.previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                    {/* Status Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      {img.status === ConversionStatus.CONVERTING && (
                        <div className="bg-black/60 backdrop-blur-sm absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                      )}
                      {img.status === ConversionStatus.COMPLETED && (
                        <div className="absolute bottom-2 left-2 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded border border-green-500/20 backdrop-blur-md font-medium flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          JPG Listo
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start text-sm">
                      <div className="truncate pr-2">
                        <p className="font-medium text-slate-200 truncate">{img.originalFile.name}</p>
                        <p className="text-slate-500 text-xs">{formatBytes(img.originalSize)}</p>
                      </div>
                      {img.convertedSize && (
                        <div className="text-right shrink-0">
                          <p className="text-indigo-400 font-medium text-xs">Nuevo JPG</p>
                          <p className="text-slate-400 text-xs">{formatBytes(img.convertedSize)}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      {img.status === ConversionStatus.IDLE && (
                        <Button 
                          onClick={() => convertImage(img.id)} 
                          variant="secondary" 
                          className="w-full text-sm py-1.5"
                        >
                          Convertir
                        </Button>
                      )}
                      {img.status === ConversionStatus.COMPLETED && img.convertedUrl && (
                        <Button 
                          onClick={() => downloadImage(img.convertedUrl!, img.originalFile.name)} 
                          className="w-full text-sm py-1.5 bg-green-600 hover:bg-green-500 shadow-green-500/20"
                        >
                          Descargar JPG
                        </Button>
                      )}
                      {img.status === ConversionStatus.ERROR && (
                        <p className="text-red-400 text-xs text-center py-2">Error al convertir</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} PNG a JPG Converter. Proceso 100% local en tu navegador.</p>
      </footer>
    </div>
  );
};

export default App;
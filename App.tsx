import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateImage, generateVideo, suggestEnhancement } from './services/geminiService';
import { MediaItem, MediaType } from './types';
import { NeonButton } from './components/NeonButton';
import { ApiKeyModal } from './components/ApiKeyModal';

// Icons
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 9h4"/></svg>
);

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // Base64
  const [showKeyModal, setShowKeyModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first item
  useEffect(() => {
    if (gallery.length > 0 && !selectedMedia) {
      setSelectedMedia(gallery[0]);
    }
  }, [gallery, selectedMedia]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt) return;
    setLoadingMessage("Consulting the AI muse...");
    setIsGenerating(true);
    try {
      const enhanced = await suggestEnhancement(prompt);
      setPrompt(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
      setLoadingMessage('');
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;

    if (activeTab === 'video') {
       // Check for key first
       if (typeof window !== 'undefined' && (window as any).aistudio) {
         const hasKey = await (window as any).aistudio.hasSelectedApiKey();
         if (!hasKey) {
           setShowKeyModal(true);
           return;
         }
       }
    }

    setIsGenerating(true);
    setLoadingMessage(activeTab === 'image' ? "Weaving pixels..." : "Rendering dreams (this may take a minute)...");

    try {
      let resultUrl = '';
      let type = activeTab === 'image' ? MediaType.IMAGE : MediaType.VIDEO;

      if (activeTab === 'image') {
        // Remove prefix data:image/png;base64, for API call if using uploaded image
        const cleanBase64 = uploadedImage ? uploadedImage.split(',')[1] : undefined;
        const mimeType = uploadedImage ? uploadedImage.match(/:(.*?);/)?.[1] : undefined;
        
        resultUrl = await generateImage(prompt, cleanBase64, mimeType);
      } else {
        resultUrl = await generateVideo(prompt);
      }

      const newItem: MediaItem = {
        id: Date.now().toString(),
        type,
        url: resultUrl,
        prompt: prompt,
        createdAt: Date.now(),
        base64Data: activeTab === 'image' ? resultUrl : undefined
      };

      setGallery(prev => [newItem, ...prev]);
      setSelectedMedia(newItem);
      
      // Clear upload after use if desired, or keep for multiple edits
      // setUploadedImage(null); 

    } catch (error: any) {
      if (error.message === 'API_KEY_REQUIRED') {
        setShowKeyModal(true);
      } else {
        alert(`Generation failed: ${error.message}`);
      }
    } finally {
      setIsGenerating(false);
      setLoadingMessage('');
    }
  };

  const handleDownload = () => {
    if (!selectedMedia) return;
    const link = document.createElement('a');
    link.href = selectedMedia.url;
    link.download = `neon_dream_${selectedMedia.id}.${selectedMedia.type === MediaType.VIDEO ? 'mp4' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neon-purple selection:text-white flex overflow-hidden">
      
      <ApiKeyModal 
        isOpen={showKeyModal} 
        onClose={() => setShowKeyModal(false)}
        onSuccess={() => {
          setShowKeyModal(false);
          handleGenerate(); // Retry generation
        }} 
      />

      {/* Sidebar Gallery */}
      <div className="w-80 glass-panel border-r border-white/10 flex flex-col z-10 hidden md:flex">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple tracking-tighter">
            NEON<span className="text-white">DREAM</span>
          </h1>
          <p className="text-xs text-gray-500 mt-2 font-mono">SURREAL STUDIO V1.0</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Recent Dreams</h3>
          {gallery.length === 0 && (
            <div className="text-gray-600 text-center text-sm py-10 italic">
              No artifacts generated yet.
            </div>
          )}
          {gallery.map(item => (
            <div 
              key={item.id}
              onClick={() => setSelectedMedia(item)}
              className={`group relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 ${selectedMedia?.id === item.id ? 'border-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.3)]' : 'border-transparent hover:border-white/30'}`}
            >
              {item.type === MediaType.IMAGE ? (
                <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" />
              ) : (
                <video src={item.url} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <span className="text-xs font-mono text-white truncate max-w-[90%] px-2">
                   {item.type}
                 </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        
        {/* Top Bar / Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-purple/5 rounded-full blur-[100px] pointer-events-none"></div>

            {selectedMedia ? (
              <div className="relative max-w-5xl w-full max-h-full flex items-center justify-center group">
                 {selectedMedia.type === MediaType.IMAGE ? (
                   <img 
                    src={selectedMedia.url} 
                    alt="Generated" 
                    className="max-h-[70vh] max-w-full rounded-lg shadow-2xl border border-white/10"
                   />
                 ) : (
                   <video 
                    src={selectedMedia.url} 
                    controls 
                    autoPlay 
                    loop 
                    className="max-h-[70vh] max-w-full rounded-lg shadow-2xl border border-white/10"
                   />
                 )}
                 
                 {/* Floating Actions */}
                 <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <NeonButton variant="secondary" onClick={handleDownload} icon={<DownloadIcon />}>
                      Save Artifact
                    </NeonButton>
                 </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 font-mono border border-dashed border-gray-700 p-20 rounded-xl bg-black/20 backdrop-blur-sm">
                <p className="text-xl mb-2">REALITY GENERATOR IDLE</p>
                <p className="text-sm">Select a mode and enter a prompt to begin.</p>
              </div>
            )}
        </div>

        {/* Bottom Control Panel */}
        <div className="glass-panel border-t border-white/10 p-6 z-20">
          <div className="max-w-4xl mx-auto space-y-4">
            
            {/* Tabs */}
            <div className="flex gap-4 mb-4">
              <button 
                onClick={() => { setActiveTab('image'); setUploadedImage(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'image' ? 'bg-neon-purple text-white shadow-[0_0_10px_rgba(176,38,255,0.4)]' : 'text-gray-400 hover:text-white'}`}
              >
                <ImageIcon /> Photo Editor
              </button>
              <button 
                onClick={() => { setActiveTab('video'); setUploadedImage(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'video' ? 'bg-neon-cyan text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]' : 'text-gray-400 hover:text-white'}`}
              >
                <VideoIcon /> Video Studio
              </button>
            </div>

            {/* Input Area */}
            <div className="flex gap-4 items-start">
               {/* Upload Image Button (Only for Photo Mode) */}
               {activeTab === 'image' && (
                 <div className="relative group">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-all ${uploadedImage ? 'border-neon-cyan bg-neon-cyan/20' : 'border-gray-600 bg-gray-800 hover:border-gray-400'}`}
                    >
                      {uploadedImage ? (
                        <img src={uploadedImage} className="w-full h-full object-cover rounded-lg" alt="upload" />
                      ) : (
                        <span className="text-2xl text-gray-400">+</span>
                      )}
                    </button>
                    {uploadedImage && (
                      <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 cursor-pointer hover:scale-110" onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}>
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </div>
                    )}
                 </div>
               )}

               {/* Prompt Input */}
               <div className="flex-1 relative">
                 <textarea
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   placeholder={activeTab === 'image' 
                     ? (uploadedImage ? "Describe how to change this image..." : "Describe a surreal image to generate...")
                     : "Describe a video to generate..."}
                   className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple focus:outline-none transition-all h-12 min-h-[48px] max-h-32 resize-none font-mono text-sm"
                 />
                 <button 
                   onClick={handleEnhancePrompt}
                   className="absolute right-2 top-2 p-1 text-neon-purple hover:text-white transition-colors hover:bg-neon-purple/20 rounded"
                   title="Surrealify Prompt"
                 >
                   <SparklesIcon />
                 </button>
               </div>

               {/* Generate Button */}
               <NeonButton 
                 onClick={handleGenerate} 
                 disabled={isGenerating || !prompt}
                 className="h-12 w-32"
               >
                 {isGenerating ? (
                   <span className="animate-pulse">PROCESSING</span>
                 ) : (
                   "GENERATE"
                 )}
               </NeonButton>
            </div>

            {/* Status Bar */}
            <div className="h-6 flex items-center justify-between text-xs font-mono text-gray-500">
               <div>
                  MODEL: <span className="text-neon-cyan">{activeTab === 'image' ? 'NANO-BANANA' : 'VEO-PREVIEW'}</span>
               </div>
               <div className="text-neon-pink">
                 {isGenerating && loadingMessage}
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

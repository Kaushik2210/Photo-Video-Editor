import React from 'react';
import { NeonButton } from './NeonButton';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      if ((window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        // Assume success if no error thrown, user flow continues
        onSuccess();
      } else {
        alert("AI Studio environment not detected.");
      }
    } catch (e) {
      console.error("Key selection failed", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-panel p-8 max-w-md w-full rounded-xl border border-neon-cyan/30 shadow-[0_0_50px_rgba(0,243,255,0.1)]">
        <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
          Access Required
        </h2>
        <p className="text-gray-300 mb-6 leading-relaxed">
          To generate high-quality video using <strong>Veo</strong>, you must connect a valid Google Cloud API key with billing enabled.
        </p>
        
        <div className="flex flex-col gap-4">
          <NeonButton onClick={handleConnect} className="w-full">
            Connect Securely
          </NeonButton>
          <button 
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-white underline mt-2"
          >
            Cancel
          </button>
        </div>
        
        <div className="mt-6 text-xs text-gray-500 border-t border-gray-800 pt-4">
          <p>Read more about billing and setup at:</p>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-neon-cyan hover:underline"
          >
            ai.google.dev/gemini-api/docs/billing
          </a>
        </div>
      </div>
    </div>
  );
};

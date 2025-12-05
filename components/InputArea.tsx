/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useState, useEffect } from 'react';
import { ArrowUpTrayIcon, SparklesIcon, CpuChipIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface InputAreaProps {
  onGenerate: (prompt: string, file?: File) => void;
  isGenerating: boolean;
  disabled?: boolean;
  lang: 'en' | 'ar';
}

const CyclingText = ({ lang }: { lang: 'en' | 'ar' }) => {
    const wordsEn = [
        "a napkin sketch",
        "a chaotic whiteboard",
        "a network scanner",
        "a game level design",
        "a sci-fi interface",
        "a diagram of a machine",
        "an ancient scroll"
    ];
    const wordsAr = [
        "رسمة على منديل",
        "سبورة فوضوية",
        "ماسح شبكات",
        "تصميم مرحلة لعبة",
        "واجهة خيال علمي",
        "مخطط آلة",
        "مخطوطة قديمة"
    ];

    const words = lang === 'ar' ? wordsAr : wordsEn;

    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false); // fade out
            setTimeout(() => {
                setIndex(prev => (prev + 1) % words.length);
                setFade(true); // fade in
            }, 500); // Wait for fade out
        }, 3000); // Slower cycle to read longer text
        return () => clearInterval(interval);
    }, [words.length, lang]); // Reset when lang changes

    return (
        <span className={`inline-block whitespace-nowrap transition-all duration-500 transform ${fade ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-sm'} text-zinc-900 dark:text-white font-medium pb-1 border-b-2 border-blue-500/50`}>
            {words[index]}
        </span>
    );
};

export const InputArea: React.FC<InputAreaProps> = ({ onGenerate, isGenerating, disabled = false, lang }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [prompt, setPrompt] = useState("");
  const isAr = lang === 'ar';

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      onGenerate("", file);
    } else {
      alert(isAr ? "يرجى تحميل صورة أو ملف PDF." : "Please upload an image or PDF.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isGenerating) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled, isGenerating]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!disabled && !isGenerating) {
        setIsDragging(true);
    }
  }, [disabled, isGenerating]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating || disabled) return;
    onGenerate(prompt.trim(), undefined);
    setPrompt("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto perspective-1000">
      <div 
        className={`relative group transition-all duration-300 ${isDragging ? 'scale-[1.01]' : ''}`}
      >
        <label
          className={`
            relative flex flex-col items-center justify-center
            h-56 sm:h-64 md:h-[20rem]
            bg-white/60 dark:bg-zinc-900/30 
            backdrop-blur-sm
            rounded-xl border border-dashed
            cursor-pointer overflow-hidden
            transition-all duration-300
            ${isDragging 
              ? 'border-blue-500 bg-blue-50/50 dark:bg-zinc-900/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]' 
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-white/80 dark:hover:bg-zinc-900/40'
            }
            ${isGenerating ? 'pointer-events-none' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
            {/* Technical Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px'}}>
            </div>
            
            {/* Corner Brackets for technical feel */}
            <div className={`absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 transition-colors duration-300 ${isDragging ? 'border-blue-500' : 'border-zinc-400 dark:border-zinc-600'}`}></div>
            <div className={`absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 transition-colors duration-300 ${isDragging ? 'border-blue-500' : 'border-zinc-400 dark:border-zinc-600'}`}></div>
            <div className={`absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 transition-colors duration-300 ${isDragging ? 'border-blue-500' : 'border-zinc-400 dark:border-zinc-600'}`}></div>
            <div className={`absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 transition-colors duration-300 ${isDragging ? 'border-blue-500' : 'border-zinc-400 dark:border-zinc-600'}`}></div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-6 md:space-y-8 p-6 md:p-8 w-full">
                <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-transform duration-500 ${isDragging ? 'scale-110' : 'group-hover:-translate-y-1'}`}>
                    <div className={`absolute inset-0 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl flex items-center justify-center ${isGenerating ? 'animate-pulse' : ''}`}>
                        {isGenerating ? (
                            <CpuChipIcon className="w-8 h-8 md:w-10 md:h-10 text-blue-400 animate-spin-slow" />
                        ) : (
                            <ArrowUpTrayIcon className={`w-8 h-8 md:w-10 md:h-10 text-zinc-400 dark:text-zinc-300 transition-all duration-300 ${isDragging ? '-translate-y-1 text-blue-400' : ''}`} />
                        )}
                    </div>
                </div>

                <div className="space-y-2 md:space-y-4 w-full max-w-3xl">
                    <h3 className="flex flex-col items-center justify-center text-xl sm:text-2xl md:text-4xl text-zinc-900 dark:text-zinc-100 leading-none font-bold tracking-tighter gap-3 transition-colors">
                        <span>{isAr ? "حول" : "Bring"}</span>
                        {/* Fixed height container to prevent layout shifts */}
                        <div className="h-8 sm:h-10 md:h-14 flex items-center justify-center w-full">
                           <CyclingText lang={lang} />
                        </div>
                        <span>{isAr ? "إلى واقع" : "to life"}</span>
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-500 text-xs sm:text-base md:text-lg font-light tracking-wide transition-colors">
                        <span className="hidden md:inline">{isAr ? "سحب وإفلات" : "Drag & Drop"}</span>
                        <span className="md:hidden">{isAr ? "اضغط" : "Tap"}</span> {isAr ? "لتحميل أي ملف" : "to upload any file"}
                    </p>
                </div>
            </div>

            <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isGenerating || disabled}
            />
        </label>
      </div>

      {/* Manual Prompt Input Area */}
      <form onSubmit={handleTextSubmit} className="mt-6 relative group z-20">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl opacity-50 group-hover:opacity-100 transition duration-500 blur-sm"></div>
          <div className="relative flex items-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-xl border border-zinc-200 dark:border-zinc-700/50 p-1.5 shadow-lg transition-colors">
              <SparklesIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500 ml-3 shrink-0" />
              <input 
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={isAr ? "أو صف فكرتك (مثال: 'لوحة تحكم لفحص الشبكات اللاسلكية المخفية')..." : "Or describe an idea (e.g. 'A Wi-Fi scanner dashboard that finds hidden networks')..."}
                  className="flex-1 bg-transparent border-0 focus:ring-0 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 px-3 py-2 text-sm sm:text-base transition-colors"
                  disabled={isGenerating || disabled}
              />
              <button 
                  type="submit"
                  disabled={!prompt.trim() || isGenerating || disabled}
                  className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-200 dark:border-zinc-700"
              >
                  {isGenerating ? (
                      <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-600 dark:border-t-white rounded-full animate-spin"></div>
                  ) : (
                      <PaperAirplaneIcon className={`w-5 h-5 ${isAr ? 'rotate-180 -translate-x-0.5' : '-rotate-45 translate-x-0.5 -translate-y-0.5'}`} />
                  )}
              </button>
          </div>
      </form>
    </div>
  );
};
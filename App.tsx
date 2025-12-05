/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { InputArea } from './components/InputArea';
import { LivePreview } from './components/LivePreview';
import { CreationHistory, Creation } from './components/CreationHistory';
import { bringToLife } from './services/gemini';
import { ArrowUpTrayIcon, SunIcon, MoonIcon, DevicePhoneMobileIcon, LanguageIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const importInputRef = useRef<HTMLInputElement>(null);

  // Initialize theme from local storage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('gemini_app_theme');
    if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        setIsDarkMode(false);
    }

    const savedLang = localStorage.getItem('gemini_app_lang') as 'en' | 'ar';
    if (savedLang) {
        setLang(savedLang);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
        html.classList.add('dark');
        localStorage.setItem('gemini_app_theme', 'dark');
    } else {
        html.classList.remove('dark');
        localStorage.setItem('gemini_app_theme', 'light');
    }
  }, [isDarkMode]);

  // Apply Language Direction and Font
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    html.lang = lang;
    
    if (lang === 'ar') {
        body.classList.add('font-arabic');
    } else {
        body.classList.remove('font-arabic');
    }

    localStorage.setItem('gemini_app_lang', lang);
  }, [lang]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  };

  const handleDownloadApk = () => {
    // Simulate APK download
    const link = document.createElement('a');
    link.href = '#'; // In a real app, this would be a real URL
    link.download = 'Nakamoko-v1.apk';
    // Just for visual feedback since we don't have a real file
    alert(lang === 'ar' ? "جاري تحضير ملف الـ APK..." : "Preparing APK download...");
    // Simulate delay
    setTimeout(() => {
        // In reality, this would trigger the browser download
        console.log("Download triggered");
    }, 1000);
  };

  // Load history from local storage or fetch examples on mount
  useEffect(() => {
    const initHistory = async () => {
      const saved = localStorage.getItem('gemini_app_history');
      let loadedHistory: Creation[] = [];

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          loadedHistory = parsed.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
          }));
        } catch (e) {
          console.error("Failed to load history", e);
        }
      }

      if (loadedHistory.length > 0) {
        setHistory(loadedHistory);
      } else {
        // If no history (new user or cleared), load examples
        try {
           const exampleUrls = [
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/vibecode-blog.json',
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/cassette.json',
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/chess.json'
           ];

           const examples = await Promise.all(exampleUrls.map(async (url) => {
               const res = await fetch(url);
               if (!res.ok) return null;
               const data = await res.json();
               return {
                   ...data,
                   timestamp: new Date(data.timestamp || Date.now()),
                   id: data.id || crypto.randomUUID()
               };
           }));
           
           const validExamples = examples.filter((e): e is Creation => e !== null);
           setHistory(validExamples);
        } catch (e) {
            console.error("Failed to load examples", e);
        }
      }
    };

    initHistory();
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (history.length > 0) {
        try {
            localStorage.setItem('gemini_app_history', JSON.stringify(history));
        } catch (e) {
            console.warn("Local storage full or error saving history", e);
        }
    }
  }, [history]);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async (promptText: string, file?: File) => {
    setIsGenerating(true);
    // Clear active creation to show loading state
    setActiveCreation(null);

    try {
      let imageBase64: string | undefined;
      let mimeType: string | undefined;

      if (file) {
        imageBase64 = await fileToBase64(file);
        mimeType = file.type.toLowerCase();
      }

      const html = await bringToLife(promptText, imageBase64, mimeType, lang);
      
      if (html) {
        // Determine a smart name for the creation
        let creationName = lang === 'ar' ? 'مشروع جديد' : 'New Creation';
        if (file) {
          creationName = file.name;
        } else if (promptText) {
          // Take first 3 words or 25 chars
          const words = promptText.split(' ');
          creationName = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
          if (creationName.length > 30) creationName = creationName.substring(0, 27) + '...';
        }

        const newCreation: Creation = {
          id: crypto.randomUUID(),
          name: creationName,
          html: html,
          // Store the full data URL for easy display
          originalImage: imageBase64 && mimeType ? `data:${mimeType};base64,${imageBase64}` : undefined,
          timestamp: new Date(),
        };
        setActiveCreation(newCreation);
        setHistory(prev => [newCreation, ...prev]);
      }

    } catch (error) {
      console.error("Failed to generate:", error);
      alert(lang === 'ar' ? "حدث خطأ ما أثناء توليد التطبيق. يرجى المحاولة مرة أخرى." : "Something went wrong while bringing your idea to life. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setActiveCreation(null);
    setIsGenerating(false);
  };

  const handleSelectCreation = (creation: Creation) => {
    setActiveCreation(creation);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = event.target?.result as string;
            const parsed = JSON.parse(json);
            
            // Basic validation
            if (parsed.html && parsed.name) {
                const importedCreation: Creation = {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp || Date.now()),
                    id: parsed.id || crypto.randomUUID()
                };
                
                // Add to history if not already there (by ID check)
                setHistory(prev => {
                    const exists = prev.some(c => c.id === importedCreation.id);
                    return exists ? prev : [importedCreation, ...prev];
                });

                // Set as active immediately
                setActiveCreation(importedCreation);
            } else {
                alert(lang === 'ar' ? "صيغة الملف غير صحيحة." : "Invalid creation file format.");
            }
        } catch (err) {
            console.error("Import error", err);
            alert(lang === 'ar' ? "فشل استيراد الملف." : "Failed to import creation.");
        }
        // Reset input
        if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const isFocused = !!activeCreation || isGenerating;
  const isAr = lang === 'ar';

  return (
    <div className={`h-[100dvh] bg-zinc-50 dark:bg-zinc-950 bg-dot-grid text-zinc-900 dark:text-zinc-50 selection:bg-blue-500/30 overflow-y-auto overflow-x-hidden relative flex flex-col transition-colors duration-300`}>
      
      {/* Top Right Controls: Theme, Lang, Download */}
      <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 flex justify-end transition-all duration-700 ${isFocused ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <div className="flex items-center space-x-2 rtl:space-x-reverse bg-white/80 dark:bg-zinc-900/80 p-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm">
            {/* Download APK Button */}
            <button
                onClick={handleDownloadApk}
                className="p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title={isAr ? "تحميل التطبيق (APK)" : "Download APK"}
            >
                <DevicePhoneMobileIcon className="w-5 h-5" />
            </button>

            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700"></div>

            {/* Language Toggle */}
            <button
                onClick={toggleLang}
                className="p-2 px-3 rounded-full text-xs font-bold font-mono text-zinc-600 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title={isAr ? "Switch to English" : "تغيير اللغة للعربية"}
            >
                {lang === 'en' ? 'AR' : 'EN'}
            </button>

            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700"></div>

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title={isDarkMode ? (isAr ? "الوضع النهاري" : "Light Mode") : (isAr ? "الوضع الليلي" : "Dark Mode")}
            >
                {isDarkMode ? (
                    <SunIcon className="w-5 h-5" />
                ) : (
                    <MoonIcon className="w-5 h-5" />
                )}
            </button>
        </div>
      </div>

      {/* Centered Content Container */}
      <div 
        className={`
          min-h-full flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 
          transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
          ${isFocused 
            ? 'opacity-0 scale-95 blur-sm pointer-events-none h-[100dvh] overflow-hidden' 
            : 'opacity-100 scale-100 blur-0'
          }
        `}
      >
        {/* Main Vertical Centering Wrapper */}
        <div className="flex-1 flex flex-col justify-center items-center w-full py-12 md:py-20">
          
          {/* 1. Hero Section */}
          <div className="w-full mb-8 md:mb-16">
              <Hero lang={lang} />
          </div>

          {/* 2. Input Section */}
          <div className="w-full flex justify-center mb-8">
              <InputArea onGenerate={handleGenerate} isGenerating={isGenerating} disabled={isFocused} lang={lang} />
          </div>

        </div>
        
        {/* 3. History Section & Footer - Stays at bottom */}
        <div className="flex-shrink-0 pb-6 w-full mt-auto flex flex-col items-center gap-6">
            <div className="w-full px-2 md:px-0">
                <CreationHistory history={history} onSelect={handleSelectCreation} lang={lang} />
            </div>
            
            <a 
              href="https://x.com/ammaar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-500 dark:text-zinc-600 hover:text-zinc-800 dark:hover:text-zinc-400 text-xs font-mono transition-colors pb-2"
            >
              Created by @ammaar
            </a>
        </div>
      </div>

      {/* Live Preview - Always mounted for smooth transition */}
      <LivePreview
        creation={activeCreation}
        isLoading={isGenerating}
        isFocused={isFocused}
        onReset={handleReset}
      />

      {/* Subtle Import Button (Bottom Right) */}
      <div className="fixed bottom-4 right-4 rtl:right-auto rtl:left-4 z-50">
        <button 
            onClick={handleImportClick}
            className="flex items-center space-x-2 rtl:space-x-reverse p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors opacity-60 hover:opacity-100"
            title={isAr ? "استيراد ملف" : "Import Artifact"}
        >
            <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline">{isAr ? "رفع ملف سابق" : "Upload previous artifact"}</span>
            <ArrowUpTrayIcon className="w-5 h-5" />
        </button>
        <input 
            type="file" 
            ref={importInputRef} 
            onChange={handleImportFile} 
            accept=".json" 
            className="hidden" 
        />
      </div>
    </div>
  );
};

export default App;
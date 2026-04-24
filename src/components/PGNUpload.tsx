import React, { useState, useRef } from 'react';
import { Upload, FileUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PGNUploadProps {
  onUpload: (pgn: string) => void;
  isAnalyzing: boolean;
  progress?: { current: number; total: number };
}

export const PGNUpload: React.FC<PGNUploadProps> = ({ 
  onUpload, 
  isAnalyzing,
  progress 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pgnText, setPgnText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.pgn') || file.name.endsWith('.txt'))) {
      readFile(file);
    } else {
      setError('Please upload a .pgn or .txt file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content && content.includes('1.')) {
        setPgnText(content);
        setError(null);
      } else {
        setError('Invalid PGN file - no moves found');
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (!pgnText.trim()) {
      setError('Please paste or upload a PGN');
      return;
    }
    
    // Basic PGN validation
    if (!pgnText.includes('1.')) {
      setError('Invalid PGN - no moves found');
      return;
    }
    
    setError(null);
    onUpload(pgnText);
  };

  const handlePasteExample = () => {
    const examplePGN = `[Event "Casual Game"]
[Site "Chess.com"]
[Date "2024.01.15"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6
8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Nc6
14. d5 Nb4 15. Bb1 a5 16. a3 Na6 17. b4 axb4 18. axb4 Nc7 19. Bb2 Bd7
20. Nf1 Rxa1 21. Bxa1 Na8 22. Ng3 Nb6 23. Nf5 Bxf5 24. exf5 Rc8 25. Bb2 Nbd7
26. Qd3 Qb7 27. Rc1 Rxc1+ 28. Bxc1 Qc7 29. Qc3 Qxc3 30. Bxc3 Nxd5 31. Bd2 f6
32. Bxh6 N7f6 33. Bxf8 Bxf8 34. Bxd5+ Nxd5 35. g4 Nb6 36. h4 Kf7 37. g5 fxg5
38. hxg5 Kg8 39. Kg2 Kf7 40. Kg3 Ke8 41. Kg4 Kd7 42. f4 Nc4 43. f6 gxf6
44. gxf6 Ne5+ 45. Kf5 Nd7 46. f7 Bh6 47. Nd4 Bg7 48. Nc6 Bh6 49. Nxe5+ dxe5
50. f8=Q Bxf8 51. Kf6 1-0`;
    setPgnText(examplePGN);
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
          isDragging 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pgn,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
            isDragging ? "bg-primary text-white" : "bg-zinc-800 text-zinc-400"
          )}>
            {isAnalyzing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <FileUp className="w-8 h-8" />
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">
              {isAnalyzing ? 'Analyzing game...' : 'Drop PGN file here or click to browse'}
            </p>
            <p className="text-xs text-zinc-500">
              Supports .pgn and .txt files
            </p>
          </div>
          
          {isAnalyzing && progress && (
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Analyzing move {progress.current} of {progress.total}</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Or divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-zinc-950 px-3 text-xs font-bold text-zinc-500 uppercase">
            Or paste PGN
          </span>
        </div>
      </div>

      {/* Text Input */}
      <div className="space-y-3">
        <textarea
          value={pgnText}
          onChange={(e) => {
            setPgnText(e.target.value);
            setError(null);
          }}
          placeholder="Paste PGN here...&#10;[Event &#34;...&#34;]&#10;1. e4 e5 2. Nf3 ..."
          className="w-full h-48 bg-zinc-900 border-2 border-zinc-800 rounded-xl p-4 text-sm font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-primary resize-none"
        />
        
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isAnalyzing || !pgnText.trim()}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Game'}
          </button>
          
          <button
            onClick={handlePasteExample}
            disabled={isAnalyzing}
            className="px-4 py-3 bg-zinc-800 text-zinc-400 rounded-xl font-bold text-sm hover:bg-zinc-700 hover:text-white transition-colors"
          >
            Example
          </button>
        </div>
      </div>
    </div>
  );
};

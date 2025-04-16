import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Info } from 'lucide-react';
import { Button } from './ui/button';
import { useVoiceRecognition } from '../hooks/use-voice-recognition';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Progress } from './ui/progress';
import { useTranslations } from '../hooks/use-translations';

interface VoiceSearchProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  open: boolean;
}

export function VoiceSearch({ onSearch, onClose, open }: VoiceSearchProps) {
  const { t } = useTranslations();
  const [isListening, setIsListening] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const progressIntervalRef = useRef<number | null>(null);
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const MAX_LISTENING_TIME = 15000; // 15 seconds max listening time
  
  const {
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport,
    error: recognitionError
  } = useVoiceRecognition({
    language: 'en-US', // TODO: Make this dynamic based on selected language
    continuous: true,
    interimResults: true,
    onResult: (result, isFinal) => {
      if (isFinal && result.trim()) {
        handleVoiceResult(result);
      }
    },
    onError: (error) => {
      console.error('Voice recognition error:', error);
      resetListening();
    },
    onEnd: () => {
      // Only automatically search if we have a transcript and weren't manually stopped
      if (transcript.trim() && isListening) {
        handleVoiceResult(transcript);
      }
      resetListening();
    }
  });
  
  // Auto stop after MAX_LISTENING_TIME
  useEffect(() => {
    if (isListening) {
      const timeout = setTimeout(() => {
        if (isListening) {
          stopListening();
          if (transcript.trim()) {
            handleVoiceResult(transcript);
          }
        }
      }, MAX_LISTENING_TIME);
      
      return () => clearTimeout(timeout);
    }
  }, [isListening, transcript, stopListening]);
  
  // Update progress bar
  useEffect(() => {
    if (isListening) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      setProgressValue(0);
      const startTime = Date.now();
      
      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / MAX_LISTENING_TIME) * 100, 100);
        setProgressValue(newProgress);
        
        if (newProgress >= 100) {
          clearInterval(progressIntervalRef.current as number);
        }
      }, 100);
    } else if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isListening]);
  
  // Auto-focus the microphone button when the dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        micButtonRef.current?.focus();
      }, 100);
    }
  }, [open]);
  
  // Clean up the voice recognition when dialog closes
  useEffect(() => {
    if (!open && isListening) {
      stopListening();
      resetListening();
    }
  }, [open, isListening, stopListening]);
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
      resetListening();
    } else {
      setIsListening(true);
      startListening();
    }
  };
  
  const resetListening = () => {
    setIsListening(false);
    setProgressValue(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };
  
  const handleVoiceResult = (text: string) => {
    onSearch(text.trim());
    resetListening();
    onClose();
  };
  
  if (!open) return null;
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">{t('voice.title')}</DialogTitle>
          <DialogDescription className="text-center">
            {isListening 
              ? t('voice.listening') 
              : t(hasRecognitionSupport ? 'voice.start' : 'voice.notSupported')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4 space-y-4">
          {/* Microphone Button */}
          <Button 
            ref={micButtonRef}
            variant="outline" 
            size="icon"
            onClick={toggleListening}
            disabled={!hasRecognitionSupport}
            className={`h-24 w-24 rounded-full ${isListening ? 'bg-primary text-primary-foreground animate-pulse' : ''}`}
          >
            {isListening ? (
              <MicOff className="h-10 w-10" />
            ) : (
              <Mic className="h-10 w-10" />
            )}
          </Button>
          
          {/* Progress Bar */}
          {isListening && (
            <div className="w-full space-y-2">
              <Progress value={progressValue} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">
                {Math.round((MAX_LISTENING_TIME - (progressValue * MAX_LISTENING_TIME / 100)) / 1000)}s
              </p>
            </div>
          )}
          
          {/* Transcript Display */}
          <div className="min-h-[60px] w-full p-3 border rounded-md bg-muted/30">
            <p className="text-center">
              {transcript || t('voice.noSpeech')}
            </p>
          </div>
          
          {/* Error Message */}
          {recognitionError && (
            <div className="text-destructive text-sm">
              {t('voice.error')}: {recognitionError.message}
            </div>
          )}
          
          {/* Voice Tips Toggle */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs flex items-center gap-1"
            onClick={() => setShowTips(!showTips)}
          >
            <Info className="h-3 w-3" />
            {showTips ? t('voice.hideTips') : t('voice.showTips')}
          </Button>
          
          {/* Voice Tips Content */}
          {showTips && (
            <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/30">
              <p className="font-medium mb-1">{t('voice.exampleCommands')}:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('voice.exampleCity')}</li>
                <li>{t('voice.exampleDate')}</li>
                <li>{t('voice.exampleComplete')}</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
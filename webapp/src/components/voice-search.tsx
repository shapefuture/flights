import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceRecognition } from '../hooks/use-voice-recognition';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { cn } from '../lib/utils';

interface VoiceSearchProps {
  onTranscript: (transcript: string) => void;
  className?: string;
  placeholder?: string;
}

export function VoiceSearch({ onTranscript, className, placeholder = 'Speak to search for flights...' }: VoiceSearchProps) {
  const [finalizedTranscript, setFinalizedTranscript] = useState('');
  const [processingVoice, setProcessingVoice] = useState(false);
  const { toast } = useToast();
  const micButtonRef = useRef<HTMLButtonElement>(null);
  
  // Animation for voice visualization
  const [amplitude, setAmplitude] = useState(0);
  const animationRef = useRef<number | null>(null);
  
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
    error
  } = useVoiceRecognition({
    language: 'en-US',
    continuous: true,
    interimResults: true,
    onResult: (newTranscript, isFinal) => {
      if (isFinal) {
        setFinalizedTranscript(newTranscript);
        setProcessingVoice(true);
        
        // Stop listening when we have a finalized result
        stopListening();
        
        // Process transcript
        setTimeout(() => {
          onTranscript(newTranscript);
          setProcessingVoice(false);
        }, 500);
      }
    },
    onError: (err) => {
      toast({
        title: 'Voice Recognition Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  });
  
  // Handle voice animation
  useEffect(() => {
    if (isListening) {
      // Start animation when listening
      let direction = 1;
      let currentAmplitude = 0;
      
      const animate = () => {
        // Simulate voice amplitude
        if (direction > 0) {
          currentAmplitude += Math.random() * 2;
          if (currentAmplitude > 50) direction = -1;
        } else {
          currentAmplitude -= Math.random() * 2;
          if (currentAmplitude < 5) direction = 1;
        }
        
        setAmplitude(currentAmplitude);
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Stop animation when not listening
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setAmplitude(0);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening]);
  
  // Show a notification if speech recognition is not supported
  useEffect(() => {
    if (!hasRecognitionSupport) {
      toast({
        title: 'Speech Recognition Not Supported',
        description: 'Your browser does not support speech recognition. Please try another browser or use text search.',
        variant: 'destructive'
      });
    }
  }, [hasRecognitionSupport, toast]);
  
  // Show error message if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: 'Voice Recognition Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [error, toast]);
  
  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2 p-4 rounded-lg border bg-card">
        <div className="flex-1">
          {processingVoice ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground">Processing your search...</span>
            </div>
          ) : isListening ? (
            <div className="text-sm">
              {transcript || <span className="text-muted-foreground">{placeholder}</span>}
            </div>
          ) : (
            <div className="text-sm">
              {finalizedTranscript || <span className="text-muted-foreground">{placeholder}</span>}
            </div>
          )}
        </div>
        
        {hasRecognitionSupport && (
          <Button
            ref={micButtonRef}
            variant={isListening ? 'default' : 'outline'}
            size="icon"
            onClick={toggleListening}
            disabled={processingVoice}
            className={cn('relative', isListening ? 'bg-red-500 hover:bg-red-600' : '')}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            
            {/* Voice visualization ring */}
            {isListening && (
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-20 bg-red-500"
                style={{
                  transform: `scale(${1 + amplitude / 100})`,
                  animation: 'none'
                }}
              />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
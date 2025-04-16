import { useState, useEffect, useCallback } from 'react';
import { debug, error, info } from '../utils/logger';

interface VoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

interface UseVoiceRecognitionReturn {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  hasRecognitionSupport: boolean;
  error: Error | null;
}

export function useVoiceRecognition(options: VoiceRecognitionOptions = {}): UseVoiceRecognitionReturn {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState(false);
  
  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window['webkitSpeechRecognition'];
    
    if (SpeechRecognition) {
      setHasRecognitionSupport(true);
      
      try {
        const recognitionInstance = new SpeechRecognition();
        
        // Configure recognition
        recognitionInstance.lang = options.language || 'en-US';
        recognitionInstance.continuous = options.continuous !== undefined ? options.continuous : true;
        recognitionInstance.interimResults = options.interimResults !== undefined ? options.interimResults : true;
        recognitionInstance.maxAlternatives = options.maxAlternatives || 1;
        
        setRecognition(recognitionInstance);
        
        debug('Voice recognition initialized successfully');
      } catch (err) {
        error('Error initializing voice recognition:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize voice recognition'));
        setHasRecognitionSupport(false);
      }
    } else {
      info('Speech recognition not supported in this browser');
      setHasRecognitionSupport(false);
    }
    
    // Cleanup
    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (err) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);
  
  // Set up event handlers when recognition instance changes
  useEffect(() => {
    if (!recognition) return;
    
    const handleResult = (event: any) => {
      try {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        
        if (options.onResult) {
          options.onResult(currentTranscript, !!finalTranscript);
        }
      } catch (err) {
        error('Error handling recognition result:', err);
      }
    };
    
    const handleError = (event: any) => {
      const recognitionError = new Error(`Recognition error: ${event.error}`);
      setError(recognitionError);
      
      if (options.onError) {
        options.onError(recognitionError);
      }
      
      // Set isListening to false in case of error
      setIsListening(false);
    };
    
    const handleEnd = () => {
      setIsListening(false);
      
      if (options.onEnd) {
        options.onEnd();
      }
    };
    
    // Add event listeners
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;
    
    return () => {
      // Remove event listeners
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
    };
  }, [recognition, options]);
  
  // Start listening
  const startListening = useCallback(() => {
    if (!recognition || !hasRecognitionSupport) {
      error('Cannot start listening: Speech recognition not supported or not initialized');
      return;
    }
    
    try {
      recognition.start();
      setIsListening(true);
      setError(null);
      
      if (options.onStart) {
        options.onStart();
      }
      
      info('Voice recognition started');
    } catch (err) {
      error('Error starting voice recognition:', err);
      setError(err instanceof Error ? err : new Error('Failed to start voice recognition'));
    }
  }, [recognition, hasRecognitionSupport, options]);
  
  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognition || !hasRecognitionSupport || !isListening) {
      return;
    }
    
    try {
      recognition.stop();
      info('Voice recognition stopped');
    } catch (err) {
      error('Error stopping voice recognition:', err);
    }
  }, [recognition, hasRecognitionSupport, isListening]);
  
  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
    error
  };
}
import React, { useRef } from 'react';
import { Button } from './ui/button';
import { useSpeechRecognition } from '../hooks/use-voice-recognition';

export const VoiceSearch = () => {
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const { 
    startListening, 
    stopListening, 
    transcript, 
    isListening, 
    status 
  } = useSpeechRecognition();
  
  // Your component implementation
  
  return (
    <div className="voice-search">
      {/* Update Button component to use ref as a regular prop rather than ref */}
      <Button 
        variant="outline" 
        onClick={() => isListening ? stopListening() : startListening()}
        disabled={status === 'notSupported'}
        className={`mic-button ${isListening ? 'listening' : ''}`}
      >
        <span>🎤</span>
        <span>{isListening ? 'Listening...' : 'Voice Search'}</span>
      </Button>
      
      {/* Rest of your component JSX */}
    </div>
  );
};

export default VoiceSearch;
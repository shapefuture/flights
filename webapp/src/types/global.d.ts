import 'react';

// Add global event type declarations to fix "Parameter 'e' implicitly has an 'any' type"
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }

  // Event handler types
  type FormEventHandler = (e: React.FormEvent<HTMLFormElement>) => void;
  type ChangeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;
  type MouseEventHandler = (e: React.MouseEvent<HTMLElement>) => void;
  type KeyboardEventHandler = (e: React.KeyboardEvent<HTMLElement>) => void;
  
  // Add any other global types needed
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage?: (message: any) => void;
        onMessage?: {
          addListener: (callback: (message: any) => void) => void;
        };
      };
    };
  }
}

export {};
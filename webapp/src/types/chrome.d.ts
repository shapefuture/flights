// Chrome API type definitions for extension service
interface Chrome {
  runtime: {
    sendMessage: (message: any, callback?: (response: any) => void) => void;
    onMessage: {
      addListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void) => void;
      removeListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void) => void;
    };
  };
  storage: {
    local: {
      get: (keys: string | string[] | null | object, callback?: (items: { [key: string]: any }) => void) => void;
      set: (items: { [key: string]: any }, callback?: () => void) => void;
      remove: (keys: string | string[], callback?: () => void) => void;
      clear: (callback?: () => void) => void;
      getBytesInUse: (keys: string | string[] | null, callback: (bytesInUse: number) => void) => void;
    };
    sync: {
      get: (keys: string | string[] | null | object, callback?: (items: { [key: string]: any }) => void) => void;
      set: (items: { [key: string]: any }, callback?: () => void) => void;
      remove: (keys: string | string[], callback?: () => void) => void;
      clear: (callback?: () => void) => void;
      getBytesInUse: (keys: string | string[] | null, callback: (bytesInUse: number) => void) => void;
    };
    onChanged: {
      addListener: (callback: (changes: { [key: string]: { oldValue?: any; newValue?: any } }, areaName: string) => void) => void;
      removeListener: (callback: (changes: { [key: string]: { oldValue?: any; newValue?: any } }, areaName: string) => void) => void;
    };
  };
  tabs: {
    query: (queryInfo: object, callback: (result: any[]) => void) => void;
    sendMessage: (tabId: number, message: any, callback?: (response: any) => void) => void;
    create: (createProperties: object, callback?: (tab: any) => void) => void;
  };
}

declare global {
  interface Window {
    chrome: Chrome;
  }
  
  var chrome: Chrome;
}

export {};
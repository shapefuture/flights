import { vi } from 'vitest';

// Setup mock chrome API before importing background
global.chrome = {
  runtime: {
    onInstalled: { addListener: vi.fn() },
    onMessageExternal: { addListener: vi.fn() },
    getManifest: vi.fn(() => ({ version: '0.1.0' })),
    lastError: null
  },
  storage: {
    local: {
      get: vi.fn().mockImplementation((keys, callback) => {
        if (callback) callback({});
        return Promise.resolve({});
      }),
      set: vi.fn().mockImplementation((data, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      getBytesInUse: vi.fn().mockImplementation((keys, callback) => {
        if (callback) callback(0);
        return Promise.resolve(0);
      })
    }
  },
  tabs: {
    sendMessage: vi.fn()
  }
};

// Now it's safe to import background
import '../background';

describe('Extension Background Script', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementations
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      if (callback) callback({});
      return Promise.resolve({});
    });
    
    chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
      return Promise.resolve();
    });
  });

  it('should initialize storage on install', () => {
    // Get the install handler
    const installHandler = chrome.runtime.onInstalled.addListener.mock.calls[0][0];
    
    // Call the handler
    installHandler();
    
    // Check that storage was initialized
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        version: expect.any(String),
        lastUpdated: expect.any(String),
        searchesCompleted: 0,
        errors: []
      }),
      expect.any(Function)
    );
  });

  it('should handle status check messages', () => {
    // Get the message handler
    const messageHandler = chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
    
    // Create a mock sender and sendResponse
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();
    
    // Call the handler with a status check message
    messageHandler({ type: 'CHECK_EXTENSION_STATUS' }, sender, sendResponse);
    
    // Check that the response was sent
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          installed: true,
          active: true,
          version: expect.any(String)
        })
      })
    );
  });

  it('should handle execution messages', async () => {
    // Get the message handler
    const messageHandler = chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
    
    // Create a mock sender and sendResponse
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();
    
    // Setup storage mock
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      if (callback) callback({ searchesCompleted: 5 });
      return Promise.resolve({ searchesCompleted: 5 });
    });
    
    // Call the handler with an execute message
    messageHandler(
      { 
        type: 'EXECUTE_FETCH', 
        payload: { 
          queries: [
            { origin: 'JFK', dest: 'LAX', depDate: '2023-06-01' }
          ] 
        } 
      }, 
      sender, 
      sendResponse
    );
    
    // Check that the response was acknowledged
    expect(sendResponse).toHaveBeenCalledWith({ received: true });
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that search count was updated
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ searchesCompleted: 6 }),
      expect.any(Function)
    );
    
    // Check that a message was sent back to the tab
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      123,
      expect.objectContaining({
        type: 'FETCH_RESULT',
        payload: expect.objectContaining({
          query: expect.any(Object),
          results: expect.any(Array)
        })
      })
    );
  });

  it('should handle cancel messages', () => {
    // Get the message handler
    const messageHandler = chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
    
    // Create a mock sender and sendResponse
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();
    
    // Call the handler with a cancel message
    messageHandler({ type: 'CANCEL_FETCH' }, sender, sendResponse);
    
    // Check that the response was acknowledged
    expect(sendResponse).toHaveBeenCalledWith({ received: true });
    
    // No further assertions needed - the cancel just sets a flag
  });

  it('should log errors to storage', async () => {
    // Get the message handler
    const messageHandler = chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
    
    // Create a mock sender and sendResponse
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();
    
    // Setup storage mock to simulate an error
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      if (callback) callback({ errors: [] });
      return Promise.resolve({ errors: [] });
    });
    
    // Force an error by passing an invalid message
    messageHandler(
      { type: 'INVALID_MESSAGE_TYPE' }, 
      sender, 
      sendResponse
    );
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that an error was logged to storage
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ 
        errors: expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(String),
            context: expect.any(String)
          })
        ]) 
      }),
      expect.any(Function)
    );
  });
});
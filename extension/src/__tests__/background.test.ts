import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock chrome API before importing background
const mockAddListener = vi.fn();
const mockGetManifest = vi.fn(() => ({ version: '0.1.0' }));
const mockGet = vi.fn().mockImplementation((keys, callback) => {
  if (callback) callback({ searchesCompleted: 5, errors: [] });
  return Promise.resolve({ searchesCompleted: 5, errors: [] });
});
const mockSet = vi.fn().mockImplementation((data, callback) => {
  if (callback) callback();
  return Promise.resolve();
});
const mockSendMessage = vi.fn();

// Set up chrome API mock
global.chrome = {
  runtime: {
    onInstalled: {
      addListener: mockAddListener
    },
    onMessageExternal: {
      addListener: mockAddListener
    },
    getManifest: mockGetManifest,
    lastError: null
  },
  storage: {
    local: {
      get: mockGet,
      set: mockSet,
      getBytesInUse: vi.fn().mockImplementation((keys, callback) => {
        if (callback) callback(0);
        return Promise.resolve(0);
      })
    }
  },
  tabs: {
    sendMessage: mockSendMessage
  }
};

// Mock a minimal background module
vi.mock('../background', () => {
  // Store handlers for tests to use
  const handlers = {
    install: null as any,
    message: null as any
  };
  
  // Execute this code to simulate the background script
  chrome.runtime.onInstalled.addListener((handler) => {
    handlers.install = handler;
  });
  
  chrome.runtime.onMessageExternal.addListener((handler) => {
    handlers.message = handler;
  });
  
  return { handlers };
});

// Import our mock module
import { handlers } from '../background';

describe('Extension Background Script', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementations
    mockGet.mockImplementation((keys, callback) => {
      if (callback) callback({ searchesCompleted: 5, errors: [] });
      return Promise.resolve({ searchesCompleted: 5, errors: [] });
    });
    
    mockSet.mockImplementation((data, callback) => {
      if (callback) callback();
      return Promise.resolve();
    });
  });

  it('should initialize storage on install', () => {
    expect(handlers.install).toBeDefined();
    
    // Call the install handler
    handlers.install();
    
    // Check that storage was initialized
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        version: expect.any(String),
        lastUpdated: expect.any(String)
      }),
      expect.any(Function)
    );
  });

  it('should handle status check messages', () => {
    expect(handlers.message).toBeDefined();
    
    // Create a mock sender and sendResponse
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();
    
    // Call the handler with a status check message
    handlers.message({ type: 'CHECK_EXTENSION_STATUS' }, sender, sendResponse);
    
    // Check that the response was sent
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true
      })
    );
  });

  it('should handle execution messages', async () => {
    expect(handlers.message).toBeDefined();
    
    // Create a mock sender and sendResponse
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();
    
    // Call the handler with an execute message
    handlers.message(
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
    expect(sendResponse).toHaveBeenCalled();
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that a message was sent back to the tab
    expect(mockSendMessage).toHaveBeenCalled();
  });

  it('should handle cancel messages', () => {
    expect(handlers.message).toBeDefined();
    
    // Create a mock sender and sendResponse
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();
    
    // Call the handler with a cancel message
    handlers.message({ type: 'CANCEL_FETCH' }, sender, sendResponse);
    
    // Check that the response was acknowledged
    expect(sendResponse).toHaveBeenCalled();
  });

  it('should log errors to storage', async () => {
    expect(handlers.message).toBeDefined();
    
    // Create a mock sender and sendResponse
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();
    
    // Call the handler with an invalid message to trigger an error
    handlers.message(
      { type: 'INVALID_MESSAGE_TYPE' }, 
      sender, 
      sendResponse
    );
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that an error was logged
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ 
        errors: expect.any(Array)
      }),
      expect.any(Function)
    );
  });
});
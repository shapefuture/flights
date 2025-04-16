import { vi } from 'vitest';

// Setup mock chrome API
const mockChrome = {
  runtime: {
    onInstalled: {
      addListener: vi.fn()
    },
    onMessageExternal: {
      addListener: vi.fn()
    },
    lastError: null
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn()
    }
  },
  tabs: {
    sendMessage: vi.fn()
  }
};

global.chrome = mockChrome as any;

// Import the module after mocking chrome
import '../background';

describe('Extension Background Script', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementations
    mockChrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({}); // Return empty object by default
    });
    
    mockChrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });
  });

  it('should initialize storage on install', () => {
    // Get the install handler
    const installHandler = mockChrome.runtime.onInstalled.addListener.mock.calls[0][0];
    
    // Call the handler
    installHandler();
    
    // Check that storage was initialized
    expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
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
    const messageHandler = mockChrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
    
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
    const messageHandler = mockChrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
    
    // Create a mock sender and sendResponse
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();
    
    // Setup storage mock
    mockChrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ searchesCompleted: 5 });
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
    expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ searchesCompleted: 6 }),
      expect.any(Function)
    );
    
    // Check that a message was sent back to the tab
    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
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
    const messageHandler = mockChrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
    
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
    const messageHandler = mockChrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
    
    // Create a mock sender and sendResponse
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();
    
    // Setup storage mock to simulate an error
    mockChrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ errors: [] });
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
    expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
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
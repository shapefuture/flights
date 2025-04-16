import { vi } from 'vitest';
import { 
  checkExtensionStatus, 
  sendMessageToExtension, 
  listenForExtensionMessages,
  isExtensionInstalled,
  ExtensionError 
} from '../extensionService';

describe('Extension Service', () => {
  let mockChrome: any;
  
  beforeEach(() => {
    // Mock the chrome API
    mockChrome = {
      runtime: {
        sendMessage: vi.fn(),
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn()
        },
        lastError: null
      }
    };
    
    // Replace global chrome with our mock
    global.chrome = mockChrome;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('ExtensionError', () => {
    it('should create an ExtensionError with all properties', () => {
      const error = new ExtensionError('Test error', 'TEST_CODE', { detail: 'Additional info' });
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ detail: 'Additional info' });
      expect(error.name).toBe('ExtensionError');
    });
  });

  describe('checkExtensionStatus', () => {
    it('should return active status when extension responds', async () => {
      // Mock a successful response
      mockChrome.runtime.sendMessage.mockImplementation((id, message, callback) => {
        callback({
          payload: {
            installed: true,
            active: true,
            version: '1.0.0'
          }
        });
      });
      
      const status = await checkExtensionStatus();
      
      expect(status).toEqual({
        installed: true,
        active: true,
        version: '1.0.0'
      });
      
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.any(String),
        { type: 'CHECK_EXTENSION_STATUS' },
        expect.any(Function)
      );
    });

    it('should return inactive status when extension is installed but not active', async () => {
      // Mock chrome.runtime.lastError
      mockChrome.runtime.sendMessage.mockImplementation((id, message, callback) => {
        mockChrome.runtime.lastError = { message: 'Extension is not active' };
        callback(null);
        mockChrome.runtime.lastError = null; // Reset after callback
      });
      
      const status = await checkExtensionStatus();
      
      expect(status).toEqual({
        installed: true,
        active: false,
        error: 'Extension is not active'
      });
    });

    it('should return not installed status when extension is not found', async () => {
      // Mock chrome.runtime.lastError for extension not found
      mockChrome.runtime.sendMessage.mockImplementation((id, message, callback) => {
        mockChrome.runtime.lastError = { message: 'Specified extension ID not exist' };
        callback(null);
        mockChrome.runtime.lastError = null; // Reset after callback
      });
      
      const status = await checkExtensionStatus();
      
      expect(status).toEqual({
        installed: false,
        active: false,
        error: 'Extension not installed'
      });
    });

    it('should handle timeout when extension does not respond', async () => {
      // Mock timeout by not calling the callback
      vi.useFakeTimers();
      mockChrome.runtime.sendMessage.mockImplementation(() => {
        // Do nothing, simulating no response
      });
      
      const statusPromise = checkExtensionStatus();
      
      // Advance timer to trigger timeout
      vi.advanceTimersByTime(6000);
      
      const status = await statusPromise;
      
      expect(status).toEqual({
        installed: true,
        active: false,
        error: 'Communication timeout'
      });
      
      vi.useRealTimers();
    });

    it('should handle when browser does not support extensions', async () => {
      // Simulate browser without extension support
      delete global.chrome;
      
      const status = await checkExtensionStatus();
      
      expect(status).toEqual({
        installed: false,
        active: false,
        error: 'Browser does not support extensions'
      });
      
      // Restore chrome
      global.chrome = mockChrome;
    });
  });

  describe('sendMessageToExtension', () => {
    it('should send a message and receive a response', async () => {
      mockChrome.runtime.sendMessage.mockImplementation((id, message, callback) => {
        callback({
          success: true,
          data: 'response data'
        });
      });
      
      const response = await sendMessageToExtension({ type: 'TEST_MESSAGE' });
      
      expect(response).toEqual({
        success: true,
        data: 'response data'
      });
      
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.any(String),
        { type: 'TEST_MESSAGE' },
        expect.any(Function)
      );
    });

    it('should throw error when extension returns error', async () => {
      mockChrome.runtime.sendMessage.mockImplementation((id, message, callback) => {
        mockChrome.runtime.lastError = { message: 'Extension error' };
        callback(null);
        mockChrome.runtime.lastError = null;
      });
      
      await expect(sendMessageToExtension({ type: 'TEST_MESSAGE' })).rejects.toThrow(ExtensionError);
      await expect(sendMessageToExtension({ type: 'TEST_MESSAGE' })).rejects.toThrow('Extension error');
    });

    it('should throw timeout error when extension does not respond', async () => {
      vi.useFakeTimers();
      mockChrome.runtime.sendMessage.mockImplementation(() => {
        // Do nothing, simulating no response
      });
      
      const promise = sendMessageToExtension({ type: 'TEST_MESSAGE' });
      
      // Advance timer to trigger timeout
      vi.advanceTimersByTime(6000);
      
      await expect(promise).rejects.toThrow('Extension communication timed out');
      await expect(promise).rejects.toThrow(ExtensionError);
      
      vi.useRealTimers();
    });

    it('should throw error when browser does not support extensions', async () => {
      // Simulate browser without extension support
      delete global.chrome;
      
      await expect(sendMessageToExtension({ type: 'TEST_MESSAGE' })).rejects.toThrow('Browser does not support extensions');
      
      // Restore chrome
      global.chrome = mockChrome;
    });
  });

  describe('listenForExtensionMessages', () => {
    it('should add a listener for extension messages', () => {
      const callback = vi.fn();
      
      const cleanup = listenForExtensionMessages(callback);
      
      expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalledWith(expect.any(Function));
      
      // Call the cleanup function
      cleanup();
      
      expect(mockChrome.runtime.onMessage.removeListener).toHaveBeenCalled();
    });

    it('should handle errors in the callback', () => {
      const errorCallback = () => {
        throw new Error('Callback error');
      };
      
      // Get the listener function that was registered
      let registeredListener: Function;
      mockChrome.runtime.onMessage.addListener.mockImplementation((listener) => {
        registeredListener = listener;
      });
      
      const cleanup = listenForExtensionMessages(errorCallback);
      
      // Simulate an incoming message
      registeredListener({ type: 'TEST_MESSAGE' });
      
      // No assertion needed - we're just checking that it doesn't throw
      
      cleanup();
    });

    it('should do nothing when browser does not support extensions', () => {
      delete global.chrome;
      
      const callback = vi.fn();
      const cleanup = listenForExtensionMessages(callback);
      
      expect(cleanup).toBeInstanceOf(Function);
      cleanup(); // Should not throw
      
      global.chrome = mockChrome;
    });
  });

  describe('isExtensionInstalled', () => {
    it('should return true when chrome.runtime exists', () => {
      expect(isExtensionInstalled()).toBe(true);
    });

    it('should return false when chrome.runtime does not exist', () => {
      delete global.chrome.runtime;
      
      expect(isExtensionInstalled()).toBe(false);
      
      global.chrome.runtime = mockChrome.runtime;
    });

    it('should return false when chrome does not exist', () => {
      delete global.chrome;
      
      expect(isExtensionInstalled()).toBe(false);
      
      global.chrome = mockChrome;
    });
  });
});
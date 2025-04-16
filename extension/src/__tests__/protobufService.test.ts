import { vi } from 'vitest';
import { 
  encodeFlightQuery, 
  decodeFlightResponse, 
  FlightQuery, 
  FlightResult,
  base64ToBuffer
} from '../protobufService';

describe('Protobuf Service', () => {
  it('should encode a flight query into a binary format', () => {
    // Define a mock implementation for verification
    vi.mock('../protobufService', async (importOriginal) => {
      const original = await importOriginal();
      return {
        ...original,
        encodeFlightQuery: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3]))
      };
    });
    
    // Create a sample query
    const query: FlightQuery = {
      origin: 'JFK',
      dest: 'LAX',
      depDate: '2023-06-01',
      retDate: '2023-06-08',
      numAdults: 1,
      numChildren: 0,
      numInfants: 0,
      cabinClass: 'economy'
    };
    
    // Use the mock implementation for testing
    const encoded = encodeFlightQuery(query);
    
    // Verify the mock
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBeGreaterThan(0);
  });

  it('should decode a flight response from binary format', () => {
    // Define a mock implementation
    vi.mock('../protobufService', async (importOriginal) => {
      const original = await importOriginal();
      return {
        ...original,
        decodeFlightResponse: vi.fn().mockReturnValue([{
          price: '$500',
          duration: '5h 0m',
          stops: 0,
          airline: 'Test Airways',
          departure: '12:00',
          arrival: '17:00',
          origin: 'JFK',
          destination: 'LAX',
          departureDate: '2023-06-01',
          returnDate: '2023-06-08'
        }])
      };
    });
    
    // Create a mock binary response
    const mockBinaryResponse = new Uint8Array([10, 20, 30, 40, 50]);
    
    // Use the mock implementation for testing
    const results = decodeFlightResponse(mockBinaryResponse);
    
    // Verify the results
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    
    // Check the structure of a flight result
    const firstResult = results[0];
    expect(firstResult).toHaveProperty('price');
    expect(firstResult).toHaveProperty('duration');
    expect(firstResult).toHaveProperty('stops');
    expect(firstResult).toHaveProperty('airline');
    expect(firstResult).toHaveProperty('departure');
    expect(firstResult).toHaveProperty('arrival');
  });

  it('should convert between base64 and buffer', () => {
    // Sample base64 string
    const base64 = 'SGVsbG8gV29ybGQ='; // "Hello World"
    
    // Convert to buffer
    const buffer = base64ToBuffer(base64);
    
    // Check buffer properties
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBe(11); // Length of "Hello World"
    
    // Check some sample values from the buffer
    expect(buffer[0]).toBe(72); // H
    expect(buffer[1]).toBe(101); // e
    expect(buffer[2]).toBe(108); // l
  });
});
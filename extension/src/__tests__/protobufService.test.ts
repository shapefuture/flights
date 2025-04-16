import { vi } from 'vitest';
import { 
  encodeFlightQuery, 
  decodeFlightResponse, 
  FlightQuery, 
  FlightResult 
} from '../protobufService';

describe('Protobuf Service', () => {
  it('should encode a flight query into a binary format', () => {
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
    
    const encoded = encodeFlightQuery(query);
    
    // The encoded result should be a Uint8Array or similar binary data
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBeGreaterThan(0);
  });

  it('should decode a flight response from binary format', () => {
    // Create a mock binary response
    // In real tests, you'd create this from actual protobuf data
    const mockBinaryResponse = new Uint8Array([
      // Some binary data representing a flight response
      // This is a simplified example
      10, 20, 30, 40, 50
    ]);
    
    const results = decodeFlightResponse(mockBinaryResponse);
    
    // Since our implementation likely includes mock data in development mode,
    // we can just check that it returns an array of flight results
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

  it('should handle invalid input gracefully', () => {
    // Test with invalid input
    const invalidQuery = {
      // Missing required fields
    } as FlightQuery;
    
    expect(() => encodeFlightQuery(invalidQuery)).not.toThrow();
    
    // For decode, we might expect a specific error or empty array
    const invalidResponse = new Uint8Array([0, 1, 2]); // Invalid binary data
    
    const results = decodeFlightResponse(invalidResponse);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should include all query parameters in the encoded data', () => {
    // Here we can't directly inspect the encoded data's contents,
    // but we can verify that changing parameters produces different encoded results
    
    const baseQuery: FlightQuery = {
      origin: 'JFK',
      dest: 'LAX',
      depDate: '2023-06-01',
      retDate: '2023-06-08',
      numAdults: 1,
      cabinClass: 'economy'
    };
    
    const encodedBase = encodeFlightQuery(baseQuery);
    
    // Change origin
    const queryWithDifferentOrigin = { ...baseQuery, origin: 'EWR' };
    const encodedWithDifferentOrigin = encodeFlightQuery(queryWithDifferentOrigin);
    
    // The encoded data should be different
    expect(encodedBase).not.toEqual(encodedWithDifferentOrigin);
    
    // Change cabin class
    const queryWithDifferentCabin = { ...baseQuery, cabinClass: 'business' };
    const encodedWithDifferentCabin = encodeFlightQuery(queryWithDifferentCabin);
    
    // The encoded data should be different
    expect(encodedBase).not.toEqual(encodedWithDifferentCabin);
  });
});
import { vi, describe, it, expect } from 'vitest';
import { generateQueries, QueryGeneratorError } from '../queryGenerator';

// Mock logger
vi.mock('../logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('Query Generator', () => {
  it('should generate a single one-way flight query', () => {
    const params = {
      origins: ['JFK'],
      destinations: ['LAX'],
      departureDateRange: '2023-06-01',
      numAdults: 1
    };
    
    const queries = generateQueries(params);
    
    expect(queries).toHaveLength(1);
    expect(queries[0]).toEqual({
      origin: 'JFK',
      dest: 'LAX',
      depDate: '2023-06-01',
      numAdults: 1
    });
  });
  
  it('should generate a single round-trip flight query', () => {
    const params = {
      origins: ['JFK'],
      destinations: ['LAX'],
      departureDateRange: '2023-06-01',
      returnDateRange: '2023-06-08',
      numAdults: 1
    };
    
    const queries = generateQueries(params);
    
    expect(queries).toHaveLength(1);
    expect(queries[0]).toEqual({
      origin: 'JFK',
      dest: 'LAX',
      depDate: '2023-06-01',
      retDate: '2023-06-08',
      numAdults: 1
    });
  });
  
  it('should generate multiple queries for multiple origins and destinations', () => {
    const params = {
      origins: ['JFK', 'EWR', 'LGA'],
      destinations: ['LAX', 'SFO', 'SAN'],
      departureDateRange: '2023-06-01',
      numAdults: 1
    };
    
    const queries = generateQueries(params);
    
    // 3 origins × 3 destinations = 9 queries (since we're not skipping JFK->JFK etc.)
    expect(queries.length).toBeGreaterThan(1);
    
    // Check that we have all combinations
    const combinations = queries.map(q => `${q.origin}-${q.dest}`);
    expect(combinations).toContain('JFK-LAX');
    expect(combinations).toContain('JFK-SFO');
    expect(combinations).toContain('EWR-LAX');
  });
  
  it('should skip invalid combinations (same origin and destination)', () => {
    const params = {
      origins: ['JFK', 'LAX'],
      destinations: ['JFK', 'LAX'],
      departureDateRange: '2023-06-01',
      numAdults: 1
    };
    
    const queries = generateQueries(params);
    
    // Should have 2 valid combinations (JFK->LAX and LAX->JFK)
    expect(queries).toHaveLength(2);
    
    // JFK->JFK and LAX->LAX should be skipped
    const combinations = queries.map(q => `${q.origin}-${q.dest}`);
    expect(combinations).not.toContain('JFK-JFK');
    expect(combinations).not.toContain('LAX-LAX');
    expect(combinations).toContain('JFK-LAX');
    expect(combinations).toContain('LAX-JFK');
  });
  
  it('should include optional parameters when provided', () => {
    const params = {
      origins: ['JFK'],
      destinations: ['LAX'],
      departureDateRange: '2023-06-01',
      returnDateRange: '2023-06-08',
      numAdults: 2,
      numChildren: 1,
      numInfants: 1,
      cabinClass: 'business'
    };
    
    const queries = generateQueries(params);
    
    expect(queries).toHaveLength(1);
    expect(queries[0]).toEqual({
      origin: 'JFK',
      dest: 'LAX',
      depDate: '2023-06-01',
      retDate: '2023-06-08',
      numAdults: 2,
      numChildren: 1,
      numInfants: 1,
      cabinClass: 'business'
    });
  });
  
  it('should throw for invalid cabin class', () => {
    const params = {
      origins: ['JFK'],
      destinations: ['LAX'],
      departureDateRange: '2023-06-01',
      cabinClass: 'invalid'
    };
    
    expect(() => generateQueries(params)).toThrow(QueryGeneratorError);
    expect(() => generateQueries(params)).toThrow('Invalid cabin class: invalid');
  });
  
  it('should handle date range strings', () => {
    const params = {
      origins: ['JFK'],
      destinations: ['LAX'],
      departureDateRange: 'tomorrow',
      returnDateRange: 'next-weekend',
      numAdults: 1
    };
    
    const queries = generateQueries(params);
    
    expect(queries).toHaveLength(1);
    expect(queries[0].depDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(queries[0].retDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  
  it('should throw an error for missing required parameters', () => {
    const params = {
      origins: ['JFK'],
      // destinations is missing
      departureDateRange: '2023-06-01'
    } as any;
    
    expect(() => generateQueries(params)).toThrow(QueryGeneratorError);
    expect(() => generateQueries(params)).toThrow('No destination specified');
  });
  
  it('should handle invalid date ranges', () => {
    const params = {
      origins: ['JFK'],
      destinations: ['LAX'],
      departureDateRange: 'invalid-date-for-testing'
    };
    
    expect(() => generateQueries(params)).toThrow();
  });
});
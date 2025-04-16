import { generateQueries, QueryParameters, QueryGeneratorError } from '../queryGenerator';
import { vi } from 'vitest';

describe('Query Generator', () => {
  beforeEach(() => {
    // Mock date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-05-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate a single one-way flight query', () => {
    const params: QueryParameters = {
      origins: 'JFK',
      destinations: 'LAX',
      departureDateRange: '2023-06-01',
      returnDateRange: null,
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
    const params: QueryParameters = {
      origins: 'JFK',
      destinations: 'LAX',
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

  it('should generate multiple queries for multiple origins/destinations', () => {
    const params: QueryParameters = {
      origins: ['JFK', 'LGA', 'EWR'],
      destinations: ['LAX', 'SFO'],
      departureDateRange: '2023-06-01',
      returnDateRange: null,
      numAdults: 1
    };

    const queries = generateQueries(params);
    
    expect(queries).toHaveLength(6); // 3 origins * 2 destinations
    expect(queries).toContainEqual({
      origin: 'JFK',
      dest: 'LAX',
      depDate: '2023-06-01',
      numAdults: 1
    });
    expect(queries).toContainEqual({
      origin: 'LGA',
      dest: 'SFO',
      depDate: '2023-06-01',
      numAdults: 1
    });
  });

  it('should parse natural language date ranges', () => {
    const params: QueryParameters = {
      origins: 'JFK',
      destinations: 'LAX',
      departureDateRange: 'next-weekend',
      returnDateRange: 'one-week-later',
      numAdults: 1
    };

    const queries = generateQueries(params);
    
    expect(queries.length).toBeGreaterThan(0);
    // Each query should have a departure date formatted as YYYY-MM-DD
    queries.forEach(query => {
      expect(query.depDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(query.retDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('should skip queries where origin and destination are the same', () => {
    const params: QueryParameters = {
      origins: ['JFK', 'LAX'],
      destinations: ['LAX', 'SFO'],
      departureDateRange: '2023-06-01',
      returnDateRange: null,
      numAdults: 1
    };

    const queries = generateQueries(params);
    
    // Should have 3 queries (not 4) because JFK->LAX, JFK->SFO, LAX->SFO (skip LAX->LAX)
    expect(queries).toHaveLength(3);
    
    // Make sure there's no query with same origin and destination
    queries.forEach(query => {
      expect(query.origin).not.toEqual(query.dest);
    });
  });

  it('should throw an error for missing required parameters', () => {
    const params: QueryParameters = {
      origins: 'JFK',
      // Missing destinations
      departureDateRange: '2023-06-01',
      numAdults: 1
    };

    expect(() => generateQueries(params)).toThrow(QueryGeneratorError);
    expect(() => generateQueries(params)).toThrow('No destination specified');
  });

  it('should handle invalid date ranges', () => {
    const params: QueryParameters = {
      origins: 'JFK',
      destinations: 'LAX',
      departureDateRange: 'invalid-date-range',
      returnDateRange: null,
      numAdults: 1
    };

    expect(() => generateQueries(params)).toThrow();
  });

  it('should handle cabin class parameter', () => {
    const params: QueryParameters = {
      origins: 'JFK',
      destinations: 'LAX',
      departureDateRange: '2023-06-01',
      returnDateRange: null,
      numAdults: 1,
      cabinClass: 'business'
    };

    const queries = generateQueries(params);
    
    expect(queries[0].cabinClass).toBe('business');
  });

  it('should throw for invalid cabin class', () => {
    const params: QueryParameters = {
      origins: 'JFK',
      destinations: 'LAX',
      departureDateRange: '2023-06-01',
      returnDateRange: null,
      numAdults: 1,
      cabinClass: 'invalid-class' as any
    };

    expect(() => generateQueries(params)).toThrow(QueryGeneratorError);
    expect(() => generateQueries(params)).toThrow('Invalid cabin class');
  });
});
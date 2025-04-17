import React, { createContext, useContext, useState, ReactNode } from "react";

export interface FilterContextType {
  // Extend as needed
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
}

export const FilterContext = createContext<FilterContextType>({
  filters: {},
  setFilters: () => {},
});

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<Record<string, any>>({});

  return (
    <FilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </FilterContext.Provider>
  );
};
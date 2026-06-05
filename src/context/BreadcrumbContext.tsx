import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface BreadcrumbContextType {
  dynamicLabels: Record<string, string>;
  setLabel: (segment: string, label: string) => void;
  clearLabels: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  dynamicLabels: {},
  setLabel: () => {},
  clearLabels: () => {},
});

export const BreadcrumbProvider = ({ children }: { children: ReactNode }) => {
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({});

  const setLabel = useCallback((segment: string, label: string) => {
    setDynamicLabels((prev) => {
      if (prev[segment] === label) return prev;
      return { ...prev, [segment]: label };
    });
  }, []);

  const clearLabels = useCallback(() => {
    setDynamicLabels({});
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ dynamicLabels, setLabel, clearLabels }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumb = () => useContext(BreadcrumbContext);

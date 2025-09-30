"use client";

import * as React from "react";

type TabsContextValue = {
  value: string | undefined;
  setValue: (v: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export const Tabs = ({ defaultValue, value, onValueChange, className, children }: TabsProps) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue);
  const activeValue = isControlled ? value : internalValue;

  const setValue = React.useCallback(
    (v: string) => {
      if (!isControlled) setInternalValue(v);
      onValueChange?.(v);
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: activeValue, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const TabsList = ({ className, children, ...props }: TabsListProps) => {
  return (
    <div role="tablist" className={className} {...props}>
      {children}
    </div>
  );
};

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export const TabsTrigger = ({ value, className, children, onClick, ...props }: TabsTriggerProps) => {
  const ctx = React.useContext(TabsContext);
  const selected = ctx?.value === value;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    ctx?.setValue(value);
    onClick?.(e);
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      data-state={selected ? "active" : "inactive"}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export const TabsContent = ({ value, className, children, ...props }: TabsContentProps) => {
  const ctx = React.useContext(TabsContext);
  const selected = ctx?.value === value;

  return (
    <div
      role="tabpanel"
      hidden={!selected}
      data-state={selected ? "active" : "inactive"}
      className={className}
      {...props}
    >
      {selected ? children : null}
    </div>
  );
};
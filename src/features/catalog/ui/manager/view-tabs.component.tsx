import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

/**
 * One view of the tab row.
 */
type ViewTab<Value extends string> = {
  value: Value;
  label: string;
};

/**
 * Props for the view tabs.
 */
type ViewTabsProps<Value extends string> = {
  label: string;
  options: readonly ViewTab<Value>[];
  value: Value;
  onSelect: (value: Value) => void;
  children: ReactNode;
};

/**
 * The catalog's sub-tabs (products, brands, categories) and the open view's panel.
 * @param props The list's accessible label, its views, the open view, the handler and the panel.
 * @returns The tabs.
 */
export function ViewTabs<Value extends string>({
  label,
  options,
  value,
  onSelect,
  children,
}: ViewTabsProps<Value>) {
  const select = (next: string) => {
    const option = options.find((candidate) => candidate.value === next);
    if (option) {
      onSelect(option.value);
    }
  };

  return (
    <Tabs value={value} onValueChange={select} className="gap-8">
      <TabsList aria-label={label}>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={value} className="grid gap-8">
        {children}
      </TabsContent>
    </Tabs>
  );
}

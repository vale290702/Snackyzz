import { cn } from "@/shared/lib/cn";

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
};

/**
 * The catalog's underlined sub-tabs (products, brands, categories), styled like the admin
 * header's section tabs.
 * @param props The group's accessible label, its views, the open view and the handler.
 * @returns The labelled group.
 */
export function ViewTabs<Value extends string>({
  label,
  options,
  value,
  onSelect,
}: ViewTabsProps<Value>) {
  return (
    <div role="group" aria-label={label} className="flex gap-2 border-b border-border">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onSelect(option.value)}
          className={cn(
            "-mb-px border-b-2 border-transparent px-4.5 py-3 text-xs text-muted-foreground",
            "focus-visible:outline-2 focus-visible:outline-orange-deep",
            "aria-pressed:border-orange-deep aria-pressed:font-bold aria-pressed:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

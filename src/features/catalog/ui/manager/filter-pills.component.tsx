import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

/**
 * One choice of a pill group.
 */
type PillOption<Value extends string> = {
  value: Value;
  label: string;
};

/**
 * Props for a pill group.
 */
type FilterPillsProps<Value extends string> = {
  label: string;
  options: readonly PillOption<Value>[];
  value: Value;
  onSelect: (value: Value) => void;
};

/**
 * A row of toggle pills where one is always chosen, such as the brand or status filter.
 * @param props The group's accessible label, its choices, the chosen value and the handler.
 * @returns The labelled group.
 */
export function FilterPills<Value extends string>({
  label,
  options,
  value,
  onSelect,
}: FilterPillsProps<Value>) {
  // A single toggle group reports "" when the chosen pill is pressed again; keep the choice.
  const select = (next: string) => {
    const option = options.find((candidate) => candidate.value === next);
    if (option) {
      onSelect(option.value);
    }
  };

  return (
    <ToggleGroup type="single" aria-label={label} value={value} onValueChange={select}>
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

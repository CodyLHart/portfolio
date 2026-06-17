import { FormEvent, useMemo, useState } from "react";
import { habitIcons, inferHabitIcon } from "../lib/icons";
import { HabitDraft, HabitFrequency } from "../types/habit";
import { HabitIcon } from "./HabitIcon";

const frequencies: HabitFrequency[] = ["daily", "weekly", "monthly"];
const colors = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0891b2",
];

type HabitFormProps = {
  onCreate: (habit: HabitDraft) => void;
};

export function HabitForm({ onCreate }: HabitFormProps) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("1");
  const [unit, setUnit] = useState("times");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [color, setColor] = useState(colors[0]);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const inferredIcon = useMemo(() => inferHabitIcon(name), [name]);
  const icon = selectedIcon ?? inferredIcon;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    const parsedTargetAmount = Number(targetAmount);

    if (!Number.isFinite(parsedTargetAmount) || parsedTargetAmount <= 0) {
      return;
    }

    onCreate({
      name: name.trim(),
      targetAmount: parsedTargetAmount,
      unit: unit.trim() || "times",
      frequency,
      icon,
      color,
    });

    setName("");
    setTargetAmount("1");
    setUnit("times");
    setFrequency("daily");
    setColor(colors[0]);
    setSelectedIcon(null);
  };

  return (
    <form className="habit-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <div>
          <p className="eyebrow">New habit</p>
        </div>
      </div>

      <label>
        Habit name
        <input
          onChange={(event) => setName(event.target.value)}
          placeholder="Read, hydrate, run..."
          value={name}
        />
      </label>

      <div className="field-row">
        <label>
          Target
          <input
            min="0"
            onChange={(event) => setTargetAmount(event.target.value)}
            step="0.25"
            type="number"
            value={targetAmount}
          />
        </label>
        <label>
          Unit
          <input
            onChange={(event) => setUnit(event.target.value)}
            value={unit}
          />
        </label>
      </div>

      <div className="segmented-control" aria-label="Frequency">
        {frequencies.map((option) => (
          <button
            className={frequency === option ? "active" : ""}
            key={option}
            onClick={() => setFrequency(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>

      <div className="swatches" aria-label="Habit color">
        {colors.map((option) => (
          <button
            aria-label={`Use color ${option}`}
            className={color === option ? "active" : ""}
            key={option}
            onClick={() => setColor(option)}
            style={{ background: option }}
            type="button"
          />
        ))}
      </div>

      <div className="icon-grid" aria-label="Habit icon">
        {Object.keys(habitIcons).map((option) => (
          <button
            className={icon === option ? "active" : ""}
            key={option}
            onClick={() => setSelectedIcon(option)}
            title={option}
            type="button"
          >
            <HabitIcon
              color={icon === option ? color : "#475569"}
              icon={option}
            />
          </button>
        ))}
      </div>

      <button className="primary-button" type="submit">
        Add habit
      </button>
    </form>
  );
}

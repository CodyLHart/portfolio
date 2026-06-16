import { habitIcons } from "../lib/icons";

type HabitIconProps = {
  icon: string;
  color?: string;
  size?: number;
};

export function HabitIcon({ icon, color = "#0f172a", size = 22 }: HabitIconProps) {
  const Icon = habitIcons[icon] ?? habitIcons.target;

  return <Icon aria-hidden="true" color={color} size={size} strokeWidth={2.25} />;
}

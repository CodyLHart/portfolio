import {
  BookOpen,
  Dumbbell,
  Flame,
  Footprints,
  GlassWater,
  HeartPulse,
  LucideIcon,
  Moon,
  Music,
  NotebookPen,
  Salad,
  Sparkles,
  Target,
} from "lucide-react";

export const habitIcons: Record<string, LucideIcon> = {
  book: BookOpen,
  dumbbell: Dumbbell,
  flame: Flame,
  footprints: Footprints,
  glassWater: GlassWater,
  heartPulse: HeartPulse,
  moon: Moon,
  music: Music,
  notebookPen: NotebookPen,
  salad: Salad,
  sparkles: Sparkles,
  target: Target,
};

const keywordMap: Array<[string[], keyof typeof habitIcons]> = [
  [["water", "drink", "hydrate"], "glassWater"],
  [["read", "book", "pages"], "book"],
  [["run", "walk", "steps"], "footprints"],
  [["gym", "lift", "workout", "exercise"], "dumbbell"],
  [["sleep", "bed"], "moon"],
  [["journal", "write"], "notebookPen"],
  [["music", "guitar", "practice"], "music"],
  [["eat", "vegetable", "salad", "food"], "salad"],
  [["heart", "health", "meditate"], "heartPulse"],
];

export const inferHabitIcon = (name: string) => {
  const normalizedName = name.toLowerCase();
  const match = keywordMap.find(([keywords]) =>
    keywords.some((keyword) => normalizedName.includes(keyword)),
  );

  return match?.[1] ?? "target";
};

export const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const formatScore = (score: number, mode: string) =>
  mode === "standard" ? `${score} pts` : `$${score}`;

export function AppIcon({
  className = "",
  fixedWidth = false,
  icon,
}: {
  className?: string;
  fixedWidth?: boolean;
  icon: string;
}) {
  return (
    <i
      aria-hidden="true"
      className={[icon, fixedWidth ? "fa-fw" : "", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

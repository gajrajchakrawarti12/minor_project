import type { CSSProperties, ReactNode } from "react";

type AppBackgroundProps = {
  children: ReactNode;
  className?: string;
};

const lightGradient: CSSProperties = {
  background:
    "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99, 102, 241, 0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 80% 90%, rgba(14, 165, 233, 0.3), transparent 50%), linear-gradient(160deg, #f8fafc 0%, #e0e7ff 45%, #f0f9ff 100%)",
};

const darkGradient: CSSProperties = {
  background:
    "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(79, 70, 229, 0.45), transparent 55%), radial-gradient(ellipse 70% 50% at 80% 90%, rgba(2, 132, 199, 0.35), transparent 50%), linear-gradient(160deg, #0f172a 0%, #1e1b4b 45%, #0c4a6e 100%)",
};

export function AppBackground({ children, className = "" }: AppBackgroundProps) {
  const isDarkMode =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  return (
    <div
      className={`min-h-screen ${className}`.trim()}
      style={isDarkMode ? darkGradient : lightGradient}
    >
      {children}
    </div>
  );
}

export default AppBackground;

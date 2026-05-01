"use client";

import { useEffect, useState } from "react";

type ThemePreference = "system" | "light" | "dark";

const labels: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark"
};

function applyTheme(theme: ThemePreference) {
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
    return;
  }
  document.documentElement.dataset.theme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem("recipeez-theme");
    const preference = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setTheme(preference);
    applyTheme(preference);
  }, []);

  function cycleTheme() {
    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem("recipeez-theme", next);
  }

  return (
    <button className="theme-toggle" type="button" onClick={cycleTheme} aria-label={`Theme: ${labels[theme]}`}>
      {labels[theme]}
    </button>
  );
}

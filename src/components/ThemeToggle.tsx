"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "light" | "dark" | "system";

const STORAGE_KEY = "shiplane.theme";

/** Resolve a mode into the class the document should carry. */
function apply(mode: Mode) {
  const dark =
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Mode | null) ?? "system";
    setMode(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, mode);
    apply(mode);

    // Follow the OS while the user is on "system".
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode, ready]);

  const options: Array<{ value: Mode; icon: typeof Sun; label: string }> = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "system", icon: Monitor, label: "System" },
    { value: "dark", icon: Moon, label: "Dark" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex items-center gap-0.5 rounded-lg bg-inset p-0.5 ring-1 ring-inset ring-line-soft"
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          title={label}
          onClick={() => setMode(value)}
          className={cn(
            "grid size-7 place-items-center rounded-md transition-colors",
            // Before hydration nothing is marked active, avoiding a flash of the
            // wrong selection when the stored mode differs from the default.
            ready && mode === value
              ? "bg-surface text-ink shadow-xs ring-1 ring-line"
              : "text-ink-3 hover:text-ink",
          )}
        >
          <Icon className="size-3.5" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Applies the stored theme before first paint.
 *
 * Without this the page renders light, then snaps to dark once React hydrates —
 * a flash that makes the whole app feel cheap.
 */
export function ThemeScript() {
  const js = `(function(){try{var m=localStorage.getItem("${STORAGE_KEY}")||"system";var d=m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})()`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

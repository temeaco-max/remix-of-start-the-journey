import { Link } from "@tanstack/react-router";
import { Bell, MessageSquare, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
import { useKurukoo } from "@/lib/kurukoo-store";
import { useProfileName } from "@/components/app-shell";
import { LiveVoice } from "@/components/kurukoo/live-voice";

function detectPlaceFromTimezone(timeZone: string) {
  const known: Record<string, string> = {
    "Africa/Accra": "Accra",
    "Africa/Lagos": "Lagos",
    "Africa/Abidjan": "Abidjan",
    "Africa/Nairobi": "Nairobi",
    "Africa/Cairo": "Cairo",
    "Europe/London": "London",
    "Europe/Dublin": "Dublin",
    "Europe/Paris": "Paris",
    "Europe/Berlin": "Berlin",
    "America/New_York": "New York",
    "America/Los_Angeles": "Los Angeles",
    "America/Chicago": "Chicago",
    "Asia/Dubai": "Dubai",
    "Asia/Singapore": "Singapore",
    "Asia/Tokyo": "Tokyo",
  };
  return known[timeZone] ?? timeZone.split("/").pop()?.replaceAll("_", " ") ?? "Your location";
}
function useLocalWeather() {
  const [weather, setWeather] = useState({ temperature: "23", place: "Accra" });
  useEffect(() => {
    let cancelled = false;
    const fallbackPlace = detectPlaceFromTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const cached = localStorage.getItem("kurukoo-location-weather");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { at: number; temperature: string; place: string };
        if (Date.now() - parsed.at < 6 * 60 * 60 * 1000)
          setWeather({ temperature: parsed.temperature, place: parsed.place });
      } catch {
        /* ignore */
      }
    }
    if (!navigator.geolocation) {
      setWeather((value) => ({ ...value, place: fallbackPlace }));
      return () => {
        cancelled = true;
      };
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m&timezone=auto`,
          );
          if (!response.ok) throw new Error("Weather unavailable");
          const data = (await response.json()) as {
            current?: { temperature_2m?: number };
            timezone?: string;
          };
          if (cancelled) return;
          const temperature =
            typeof data.current?.temperature_2m === "number"
              ? String(Math.round(data.current.temperature_2m))
              : "23";
          const place = detectPlaceFromTimezone(data.timezone ?? fallbackPlace);
          setWeather({ temperature, place });
          localStorage.setItem(
            "kurukoo-location-weather",
            JSON.stringify({ at: Date.now(), temperature, place }),
          );
        } catch {
          if (!cancelled) setWeather((value) => ({ ...value, place: fallbackPlace }));
        }
      },
      () => {
        if (!cancelled) setWeather((value) => ({ ...value, place: fallbackPlace }));
      },
      { maximumAge: 6 * 60 * 60 * 1000, timeout: 8000 },
    );
    return () => {
      cancelled = true;
    };
  }, []);
  return weather;
}
function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  if (hour >= 18 && hour < 22) return "Good evening";
  return "Good night";
}
function useLocalDateTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const locale = Intl.DateTimeFormat().resolvedOptions().locale || "en-GB";
  return {
    greeting: getGreeting(now.getHours()),
    date: new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(now),
  };
}
export function PageHeader() {
  const weather = useLocalWeather();
  const { greeting, date } = useLocalDateTime();
  const profileName = useProfileName();
  const { notifications } = useKurukoo();
  const unread = notifications.filter((item) => !item.read).length;
  return (
    <header
      className="flex h-12 min-h-12 shrink-0 items-center justify-between gap-4 border-b border-border/70 pb-3"
      aria-label="Page header"
    >
      <div className="flex min-w-0 items-center gap-2 text-[12px] text-muted-foreground">
        <p className="shrink-0 font-medium text-foreground">
          {greeting}, {profileName}
        </p>
        <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
          <SunMedium className="size-4 shrink-0 text-[#c58d62]" />
          {weather.temperature}°C · {weather.place}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-2 text-[12px] text-muted-foreground sm:inline-flex">
          <span>{date}</span>
          <span aria-hidden className="h-4 w-px bg-border" />
          <span>
            <strong className="font-semibold text-foreground">480</strong> pts
          </span>
        </span>
        <Link
          to="/activity"
          aria-label="Open activity"
          className="relative grid size-9 place-items-center rounded-full hover:bg-elevated"
        >
          <Bell className="size-[17px] text-muted-foreground" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />
          ) : null}
        </Link>
        <Link
          to="/chat"
          aria-label="Open conversation"
          className="grid size-9 place-items-center rounded-full hover:bg-elevated"
        >
          <MessageSquare className="size-[17px] text-muted-foreground" />
        </Link>
        <LiveVoice />
      </div>
    </header>
  );
}

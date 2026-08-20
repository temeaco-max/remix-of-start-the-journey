import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const chatSource = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
const discoverSource = readFileSync(resolve(process.cwd(), "app/(tabs)/discover.tsx"), "utf8");

describe("experience feedback contract", () => {
  it("keeps Chat loading and empty states inside the canonical composer surface", () => {
    expect(chatSource).toContain('"loading" | "ready" | "empty"');
    expect(chatSource).toContain("Preparing your conversation");
    expect(chatSource).toContain("No conversation to show yet");
    expect(chatSource).toContain("Ask Kurukoo");
    expect(chatSource).toContain("Kurukoo is typing");
    expect(chatSource).toContain("Read by Kurukoo");
  });

  it("keeps Discover loading, sparse and empty states source-truthful", () => {
    expect(discoverSource).toContain("useState(true)");
    expect(discoverSource).toContain("Preparing Discover…");
    expect(discoverSource).toContain('density: "empty"');
    expect(discoverSource).toContain("Discover is available even when the local network is quiet");
    expect(discoverSource).toContain("Nothing attributed here yet.");
    expect(discoverSource).toContain("RefreshControl");
    expect(discoverSource).toContain("setRefreshing(true)");
    expect(discoverSource).toContain("do not claim a watch was stored");
  });
});

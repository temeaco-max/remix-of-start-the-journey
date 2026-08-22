import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { KURUKOO_MARK_PATH, KURUKOO_VISUAL_TOKENS } from "../lib/visual-contract";

const themeSource = readFileSync(resolve(process.cwd(), "theme.config.js"), "utf8");
const richMessageSource = readFileSync(resolve(process.cwd(), "components/chat-rich-message.tsx"), "utf8");
const goLiveSource = readFileSync(resolve(process.cwd(), "components/go-live-flow.tsx"), "utf8");
const firstLaunchSource = readFileSync(resolve(process.cwd(), "components/first-launch-verification.tsx"), "utf8");
const nativeTabSource = readFileSync(resolve(process.cwd(), "app/(tabs)/_layout.tsx"), "utf8");

describe("Kurukoo visual contract", () => {
  it("keeps the authoritative warm brand tokens", () => {
    expect(KURUKOO_VISUAL_TOKENS.primary).toBe("#B95D3C");
    expect(KURUKOO_VISUAL_TOKENS.background).toBe("#F7F2EC");
    expect(KURUKOO_VISUAL_TOKENS.foreground).toBe("#24221F");
    expect(KURUKOO_VISUAL_TOKENS.border).toBe("#E6DED5");
    expect(KURUKOO_VISUAL_TOKENS.success).toBe("#2E8060");
    expect(KURUKOO_VISUAL_TOKENS.warning).toBe("#B87928");
    expect(KURUKOO_VISUAL_TOKENS.error).toBe("#B5483D");
    expect(KURUKOO_VISUAL_TOKENS.info).toBe("#3C6F91");
  });

  it("keeps the runtime theme authority aligned", () => {
    expect(themeSource).toContain("primary: { light: '#B95D3C'");
    expect(themeSource).toContain("background: { light: '#F7F2EC'");
    expect(themeSource).toContain("foreground: { light: '#24221F'");
    expect(themeSource).toContain("border: { light: '#E6DED5'");
    expect(themeSource).toContain("success: { light: '#2E8060'");
    expect(themeSource).toContain("warning: { light: '#B87928'");
  });

  it("uses the intended typography family names", () => {
    expect(KURUKOO_VISUAL_TOKENS.bodyFont).toBe("Inter");
    expect(KURUKOO_VISUAL_TOKENS.headingFont).toBe("Space Grotesk");
  });

  it("uses the exact authoritative Kurukoo mark asset", () => {
    expect(KURUKOO_MARK_PATH).toBe("assets/images/kurukoo-logo.png");
  });

  it("keeps rich-message actions at the shared 44px interaction rhythm", () => {
    expect(richMessageSource).toContain('actionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: 4, minHeight: 44 }');
    expect(richMessageSource).toContain('copyButton: { minHeight: 44');
    expect(richMessageSource).toContain('iconButton: { minWidth: 44, minHeight: 44');
  });

  it("keeps the Go Live consent decision at the shared 44px interaction rhythm", () => {
    expect(goLiveSource).toContain('checkRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }');
  });

  it("keeps first-launch Change controls at the shared 44px interaction rhythm", () => {
    expect(firstLaunchSource).toContain('style={styles.changeButton}');
    expect(firstLaunchSource).toContain('changeButton: { minWidth: 60, minHeight: 44, alignItems: "flex-end", justifyContent: "center" }');
  });

  it("keeps the native feature-compass overflow action at the shared 44px interaction rhythm", () => {
    expect(nativeTabSource).toContain("accessibilityLabel=\"Explore all Kurukoo features\"");
    expect(nativeTabSource).toContain("compass: { position: 'absolute', right: 14, bottom: 80, minWidth: 76, minHeight: 44, height: 44, borderRadius: 22");
  });
});

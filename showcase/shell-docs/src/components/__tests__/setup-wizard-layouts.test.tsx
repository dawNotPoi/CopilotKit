// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SetupWizard } from "../setup-wizard";
import type { MapPick } from "@/lib/homepage-map";

vi.mock("posthog-js/react", () => ({ usePostHog: () => null }));

const frontends: MapPick[] = [
  { id: "react", name: "React", logo: { kind: "frontend", icon: "react" } },
];
const backends: MapPick[] = Array.from({ length: 18 }, (_, index) => ({
  id: `backend-${index}`,
  name: `Backend ${index}`,
  logo: { kind: "framework", slug: `backend-${index}` },
}));

beforeEach(() => {
  window.history.replaceState({}, "", "/?wizardLayout=a");
  window.scrollBy = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

function mount(fixedBackend?: string) {
  return render(
    <SetupWizard
      frontends={frontends}
      backends={backends}
      capabilities={[]}
      fixedBackend={fixedBackend}
    />,
  );
}

describe("setup wizard layout previews", () => {
  it("keeps the active step and answers when switching between A and B", () => {
    mount();
    expect(document.querySelector(".wizard-journey")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Existing project/ }));
    expect(screen.getByRole("heading", { name: "Your frontend" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "B · Focused step" }));
    expect(document.querySelector(".wizard-rail-layout")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Your frontend" })).toBeTruthy();
    expect(
      document.querySelector(".wizard-rail-progress-footer")?.textContent,
    ).toContain("Step 2 of 5");
    expect(
      document.querySelector(".wizard-rail-progress")?.textContent,
    ).toContain("Existing project");
    expect(new URLSearchParams(location.search).get("project")).toBe("yes");
    expect(new URLSearchParams(location.search).get("wizardLayout")).toBe("b");
    expect(
      Array.from(
        document.querySelectorAll(".wizard-rail-progress ol button"),
      ).map((button) => button.getAttribute("data-selected")),
    ).toEqual(["true", null, null, null, null]);
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(
      document
        .querySelector(".wizard-rail-progress-footer")
        ?.contains(screen.getByRole("button", { name: "Previous step" })),
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Previous step" }));
    expect(
      screen.getByRole("heading", { name: "Where are you starting?" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next visited step" }));
    expect(screen.getByRole("heading", { name: "Your frontend" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "React" }));
    expect(
      screen.getByRole("heading", { name: "Your agent backend" }),
    ).toBeTruthy();
    expect(
      document
        .querySelector(".wizard-rail-active-marker")
        ?.getAttribute("style"),
    ).toContain("8rem");
    expect(screen.getAllByRole("button", { name: /Backend \d+/ })).toHaveLength(
      18,
    );
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Next visited step",
      }).disabled,
    ).toBe(true);
    expect(
      Array.from(
        document.querySelectorAll(".wizard-rail-progress ol button"),
      ).map((button) => button.getAttribute("data-selected")),
    ).toEqual(["true", "true", null, null, null]);
    fireEvent.click(screen.getByRole("button", { name: "Backend 17" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(
      screen.getByRole("heading", { name: "Ready to set up" }),
    ).toBeTruthy();
    expect(
      Array.from(
        document.querySelectorAll(".wizard-rail-progress ol button"),
      ).map((button) => button.getAttribute("data-selected")),
    ).toEqual(["true", "true", "true", null, null]);

    fireEvent.click(screen.getByRole("button", { name: "A · Open journey" }));
    expect(document.querySelector(".wizard-journey")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Ready to set up" }),
    ).toBeTruthy();
    expect(new URLSearchParams(location.search).get("backend")).toBe(
      "backend-17",
    );
  });

  it("keeps A's question in one stage without moving the docs pane", () => {
    mount();
    const stage = document.querySelector(".wizard-journey-stage");
    expect(stage).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Existing project/ }));
    expect(document.querySelector(".wizard-journey-stage")).toBe(stage);
    expect(
      stage?.contains(screen.getByRole("heading", { name: "Your frontend" })),
    ).toBe(true);
    expect(document.querySelectorAll(".wizard-journey-step")).toHaveLength(5);
    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  it("animates the layout switch and incoming B question when motion is allowed", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const animate = vi.fn().mockReturnValue({ cancel: vi.fn() });
    const originalAnimate = Element.prototype.animate;
    Element.prototype.animate = animate;
    try {
      mount();
      fireEvent.click(screen.getByRole("button", { name: "B · Focused step" }));
      expect(animate).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole("button", { name: /Existing project/ }));
      expect(animate).toHaveBeenCalledTimes(2);
      expect(
        screen.getByRole("heading", { name: "Your frontend" }),
      ).toBeTruthy();
    } finally {
      Element.prototype.animate = originalAnimate;
    }
  });

  it("keeps the fixed backend out of partner progress in both layouts", () => {
    window.history.replaceState({}, "", "/mastra?wizardLayout=b");
    mount("backend-0");
    expect(
      document
        .querySelector(".wizard-rail-progress ol button")
        ?.getAttribute("data-selected"),
    ).toBeNull();
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Previous step",
      }).disabled,
    ).toBe(true);
    expect(
      document.querySelector(".wizard-rail-progress")?.textContent,
    ).not.toContain("Backend");
    fireEvent.click(
      screen.getByRole("button", { name: /Existing project.*Add/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "A · Open journey" }));
    expect(
      document.querySelector(".wizard-journey")?.textContent,
    ).not.toContain("Backend");
    expect(screen.getByRole("heading", { name: "Your frontend" })).toBeTruthy();
  });
});

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";

const publicRoutes = [
  "/",
  "/splash",
  "/onboarding",
  "/onboarding-form",
  "/language",
  "/login",
  "/otp",
  "/about",
  "/privacy",
  "/terms",
  "/unknown-route",
];

const protectedRoutes = [
  "/home",
  "/chat",
  "/documents",
  "/documents/new",
  "/portal-tracker",
  "/lawyers",
  "/lawyers/missing-lawyer",
  "/rti",
  "/community",
  "/community/new",
  "/community/missing-post",
  "/notifications",
  "/cases",
  "/profile",
  "/profile/edit",
  "/profile/saved-documents",
  "/profile/appointments",
  "/profile/saved-lawyers",
  "/profile/help",
];

const seedGuestSession = () => {
  window.localStorage.setItem("guestMode", "true");
  window.localStorage.setItem("guestName", "QA Tester");
  window.localStorage.setItem("onboardingComplete", "true");
  window.localStorage.setItem(
    "ls.profile",
    JSON.stringify({ name: "QA Tester", email: "", state: "Delhi", interests: [] }),
  );
};

const renderAt = (route: string, authenticated = false) => {
  window.history.pushState({}, "Test route", route);
  if (authenticated) seedGuestSession();
  return render(<App />);
};

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("app route smoke coverage", () => {
  it.each(publicRoutes)("renders public route %s without crashing", async (route) => {
    renderAt(route);

    await waitFor(() => {
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });

  it.each(protectedRoutes)("renders protected route %s without crashing for a guest session", async (route) => {
    renderAt(route, true);

    await waitFor(() => {
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });
});

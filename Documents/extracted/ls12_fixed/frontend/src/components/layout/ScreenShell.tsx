import { type ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { GuestBanner } from "@/components/layout/GuestBanner";

interface Props {
  children: ReactNode;
  hideNav?: boolean;
  hideGuestBanner?: boolean;
}

export const ScreenShell = ({ children, hideNav = false, hideGuestBanner = false }: Props) => {
  return (
    <div className="min-h-[100dvh] bg-mandala">
      <div className="max-w-md mx-auto bg-background min-h-[100dvh] relative">
        {!hideGuestBanner && <GuestBanner />}
        <main className={hideNav ? "" : "pb-24"}>{children}</main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
};

import { type ReactNode } from "react";
import { SideNav } from "@desktop/components/layout/SideNav";
import { GuestBanner } from "@desktop/components/layout/GuestBanner";

interface Props {
  children: ReactNode;
  hideNav?: boolean;
  hideGuestBanner?: boolean;
}

export const ScreenShell = ({ children, hideNav = false, hideGuestBanner = false }: Props) => {
  return (
    <div className="min-h-screen bg-mandala flex">
      {!hideNav && <SideNav />}
      <div className={`flex-1 flex flex-col min-h-screen overflow-hidden ${hideNav ? "" : "ml-64"}`}>
        {!hideGuestBanner && <GuestBanner />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

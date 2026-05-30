import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ShieldAlert } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <ScreenShell>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center animate-fade-in-up">
        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 rounded-full border border-destructive/30 animate-pulse-ring" />
          <ShieldAlert size={40} className="text-destructive relative z-10" />
        </div>
        
        <h1 className="font-display font-bold text-6xl text-foreground mb-2 tracking-tight">404</h1>
        <h2 className="font-display font-semibold text-xl mb-4 text-primary">Case Dismissed</h2>
        
        <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
          The page you're looking for has been moved, deleted, or doesn't exist in our legal archives.
        </p>
        
        <Link 
          to="/" 
          className="flex items-center gap-2 h-12 px-6 rounded-button bg-primary text-primary-foreground font-medium text-sm shadow-md hover:shadow-lg tap"
        >
          <Home size={16} />
          Return to Dashboard
        </Link>
      </div>
    </ScreenShell>
  );
};

export default NotFound;

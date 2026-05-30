import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { type ReactNode } from "react";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isGuest } = useAuth();
  if (!isAuthenticated && !isGuest) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

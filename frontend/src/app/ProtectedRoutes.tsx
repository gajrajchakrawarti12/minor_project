import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authContext } from "@/features/auth/authContext";
import AppBackground from "@/shared/components/AppBackground";

function ProtectedRoutes() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const authenticated = await authContext.isAuthenticated();
      if (isMounted) {
        setIsAllowed(authenticated);
        setIsChecking(false);
      }
    };

    void checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return (
      <AppBackground className="flex min-h-screen items-center justify-center">
        <div className="glass-panel flex items-center gap-3 px-6 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Verifying session…
        </div>
      </AppBackground>
    );
  }

  if (!isAllowed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default ProtectedRoutes;

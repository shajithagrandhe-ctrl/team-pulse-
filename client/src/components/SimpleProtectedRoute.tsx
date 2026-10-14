import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const SimpleProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/backend-auth" replace />;
  }

  return <>{children}</>;
};

export default SimpleProtectedRoute;
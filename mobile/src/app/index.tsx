import { Redirect } from "expo-router";
import { useAuth } from "../auth/AuthProvider";

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? "/home" : "/login"} />;
}

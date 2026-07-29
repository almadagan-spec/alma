import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import SignupScreen from "./screens/SignupScreen";
import LoginScreen from "./screens/LoginScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import SearchScreen from "./screens/SearchScreen";
import MyListScreen from "./screens/MyListScreen";
import SharedWithMeScreen from "./screens/SharedWithMeScreen";
import SharedListScreen from "./screens/SharedListScreen";
import "./App.css";

function RootRedirect() {
  const { loading, session } = useAuth();
  if (loading) return null;
  return <Navigate to={session ? "/welcome" : "/signup"} replace />;
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { loading, session } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/signup" replace />;
  return children;
}

function SetupNotice() {
  return (
    <div className="screen">
      <div className="setup-notice">
        <h1>Setup needed</h1>
        <p>
          Alma needs a Supabase project to run. Set{" "}
          <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> — see the README.
        </p>
      </div>
    </div>
  );
}

function App() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route
        path="/welcome"
        element={
          <RequireAuth>
            <WelcomeScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/search"
        element={
          <RequireAuth>
            <SearchScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/my-list"
        element={
          <RequireAuth>
            <MyListScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/shared"
        element={
          <RequireAuth>
            <SharedWithMeScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/shared/:ownerId"
        element={
          <RequireAuth>
            <SharedListScreen />
          </RequireAuth>
        }
      />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;

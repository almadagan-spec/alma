import { Navigate, Route, Routes } from "react-router-dom";
import { useAppContext } from "./AppContext";
import SignupScreen from "./screens/SignupScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import SearchScreen from "./screens/SearchScreen";
import MyListScreen from "./screens/MyListScreen";
import "./App.css";

function RootRedirect() {
  const { user } = useAppContext();
  return <Navigate to={user ? "/welcome" : "/signup"} replace />;
}

function RequireUser({ children }: { children: React.ReactElement }) {
  const { user } = useAppContext();
  if (!user) return <Navigate to="/signup" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route
        path="/welcome"
        element={
          <RequireUser>
            <WelcomeScreen />
          </RequireUser>
        }
      />
      <Route
        path="/search"
        element={
          <RequireUser>
            <SearchScreen />
          </RequireUser>
        }
      />
      <Route
        path="/my-list"
        element={
          <RequireUser>
            <MyListScreen />
          </RequireUser>
        }
      />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;

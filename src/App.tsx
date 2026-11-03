import { isPreview } from "./lib/runtime";
import { useEffect, lazy, Suspense, type ReactNode } from "react";
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Shell from "./components/layout/Shell";
import { Spinner, EmptyState } from "./components/ui";
import Login from "./pages/Login";
import { useAppStore } from "./store";
const Dashboard = lazy(() => import("./pages/Dashboard")),
  Tracking = lazy(() => import("./pages/Tracking")),
  Catalogue = lazy(() => import("./pages/Catalogue")),
  Orders = lazy(() => import("./pages/Orders")),
  Inventory = lazy(() => import("./pages/Inventory")),
  Credits = lazy(() => import("./pages/Credits")),
  Alerts = lazy(() => import("./pages/Alerts")),
  Settings = lazy(() => import("./pages/Settings"));
function Access({ roles, children }: { roles: string[]; children: ReactNode }) {
  const user = useAppStore((s) => s.user);
  return user && roles.includes(user.role) ? (
    children
  ) : (
    <EmptyState
      title="Access restricted"
      description="Your role does not have permission to open this page."
      action={
        <Link to="/dashboard" className="text-gold">
          Return to overview
        </Link>
      }
    />
  );
}
const Router = isPreview ? HashRouter : BrowserRouter;
export default function App() {
  const s = useAppStore();
  useEffect(() => {
    void s.checkAuth();
  }, [s.checkAuth]);
  return (
    <>
      <Router>
        {!s.authChecked ? (
          <Spinner />
        ) : !s.user ? (
          <Login />
        ) : !s.loaded ? (
          <EmptyState
            title="Workspace unavailable"
            description="The operations data could not be loaded."
            action={
              <button
                aria-label="Retry loading workspace"
                onClick={() => void s.refresh()}
              >
                Retry
              </button>
            }
          />
        ) : (
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route path="/" element={<Shell />}>
                <Route index element={<Navigate replace to="/dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route
                  path="tracking"
                  element={
                    <Access roles={["Admin", "Operations"]}>
                      <Tracking />
                    </Access>
                  }
                />
                <Route
                  path="catalogue"
                  element={
                    <Access roles={["Admin", "Operations"]}>
                      <Catalogue />
                    </Access>
                  }
                />
                <Route path="orders" element={<Orders />} />
                <Route
                  path="inventory"
                  element={
                    <Access roles={["Admin", "Operations"]}>
                      <Inventory />
                    </Access>
                  }
                />
                <Route
                  path="credits"
                  element={
                    <Access roles={["Admin", "Finance"]}>
                      <Credits />
                    </Access>
                  }
                />
                <Route path="alerts" element={<Alerts />} />
                <Route
                  path="settings"
                  element={
                    <Access roles={["Admin"]}>
                      <Settings />
                    </Access>
                  }
                />
                <Route
                  path="*"
                  element={
                    <EmptyState
                      title="Page not found"
                      action={<Link to="/dashboard">Back to overview</Link>}
                    />
                  }
                />
              </Route>
            </Routes>
          </Suspense>
        )}
      </Router>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            "!rounded-xl !border-[0.5px] !border-edge !bg-noir !text-ivory !text-base !shadow-none",
        }}
      />
    </>
  );
}

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    createBrowserRouter,
    createRoutesFromElements,
    RouterProvider,
    useNavigation,
    Outlet
} from "react-router-dom";
import Login from "./pages/Login";
import { checkAuth } from "./lib/Api/loginApi";
import Dashboard, { dashboardLoader } from "./pages/Dashboard";
import DashboardLayout from "./components/DashboardLayout";
import OrdersPage, { orderLoader } from "./pages/Order";

// Renders children only when session is valid, otherwise redirects to login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return checkAuth() ? (
        <DashboardLayout>{children}</DashboardLayout>
    ) : (
        <Navigate to="/dashboard" replace />
    );
};

// Redirects already-logged-in users away from the login page
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    return checkAuth() ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

// Global layout to catch all top-level routing
const GlobalLayout = () => {
    return <Outlet />;
};

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route element={<GlobalLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                    loader={dashboardLoader}
                />
                <Route
                    path="/orders"
                    element={<ProtectedRoute><OrdersPage/></ProtectedRoute>}
                    loader={orderLoader}
                />
                <Route
                    path="/customers"
                    element={<ProtectedRoute><div>Customers Page</div></ProtectedRoute>}
                />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Route>
        </>

    )
);

const App = () => <RouterProvider router={router} />;
export default App;

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

// Global layout to catch all top-level routing transitions
const GlobalLayout = () => {
    const navigation = useNavigation();
    const isLoading = navigation.state === "loading";

    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    {/* Replace this with any custom spinner/loading component you want */}
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin">
                    </div>
                </div>
            )}
            <Outlet />
        </>
    );
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
                    element={<ProtectedRoute><div>Orders Page</div></ProtectedRoute>}
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

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import { checkAuth } from "./lib/Api/loginApi";
import Dashboard from "./pages/Dashboard";
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

const App = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
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
        </Routes>
    </BrowserRouter>
);

export default App;

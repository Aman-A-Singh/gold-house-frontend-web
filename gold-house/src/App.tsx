import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import { isAuthenticated } from "./lib/api";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/DashboardLayout";

// Redirect to login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated() ? (
        <DashboardLayout>{children}</DashboardLayout>
    ) : (
        <Navigate to="/login" replace />
    );
};



const App = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={isAuthenticated() ? <Navigate to="/dashboard" /> : <Login />} />
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

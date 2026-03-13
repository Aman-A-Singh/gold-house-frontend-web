import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import { isAuthenticated } from "./lib/api";

// Redirect to login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated() ? <>{children}</> : <Navigate to="/" replace />;
};

// Temporary dashboard placeholder
const Dashboard = () => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-secondary">Gold House</h1>
            <p className="text-muted-foreground">Dashboard — coming soon</p>
        </div>
    </div>
);

const App = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    </BrowserRouter>
);

export default App;

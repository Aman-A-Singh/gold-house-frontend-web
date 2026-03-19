import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, User, AlertCircle } from "lucide-react";
import { login } from "@/lib/api";

const Login = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login({ username: userName, password });
            // Cookie is set automatically by server — no token saving needed
            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Logo */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-wider text-secondary">GOLD HOUSE</h1>
                    <p className="text-primary-foreground/60 text-sm mt-1">Management Dashboard</p>
                </div>

                <Card className="shadow-2xl border-secondary/20 bg-card rounded-2xl">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-xl text-foreground">Sign In</CardTitle>
                        <CardDescription>Enter your credentials to continue</CardDescription>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="userName">User name</Label>
                                    <div className="relative mt-2">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="userName"
                                            type="text"
                                            placeholder="User Name"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            className="pl-10"
                                            autoComplete="username"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative mt-2">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 pr-10"
                                            autoComplete="current-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                    disabled={loading}
                                >
                                    {loading ? "Signing in…" : "Sign In"}
                                </Button>
                            </form>
                        </CardContent>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
};

export default Login;
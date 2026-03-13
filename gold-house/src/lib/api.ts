const BASE_URL = "/api";

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    [key: string]: unknown;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });

    if (!res.ok) {
        // Try to extract a message from the response body
        let message = "Invalid credentials";
        try {
            const body = await res.json();
            message = body.message ?? body.error ?? message;
        } catch {
            // ignore parse errors
        }
        throw new Error(message);
    }

    return res.json();
}

// ─── Token helpers ────────────────────────────────────────────────────────────

const TOKEN_KEY = "gh_token";

export const saveToken = (token: string) =>
    localStorage.setItem(TOKEN_KEY, token);

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const isAuthenticated = () => Boolean(getToken());

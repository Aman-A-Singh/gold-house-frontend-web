const BASE_URL = "/api";

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
    username: string;
    password: string;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
}

export interface LoginResponse {
    [key: string]: unknown;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include", // browser stores the HttpOnly cookie from Set-Cookie header
    });

    if (!res.ok) {
        let message = "Invalid credentials";
        try {
            const body = await res.json();
            message = body.message ?? body.error ?? message;
        } catch {
            // ignore parse errors
        }
        throw new Error(message);
    }

    const data: { data: LoginResponse } = await res.json();

    // Store only the expiry time — NOT the token itself
    // Matches jwt.expiration = 3600000 (1 hour) in application.properties
    localStorage.setItem("gh_session_exp", String(Date.now() + 3600000));

    return data.data;
}

// ─── Session helpers ──────────────────────────────────────────────────────────

/**
 * Instant client-side session check — reads the expiry timestamp stored on login.
 * The actual JWT lives in an HttpOnly cookie and is never accessible to JS.
 * Returns false when no session exists or the session has expired.
 */
export function checkAuth(): boolean {
    const exp = localStorage.getItem("gh_session_exp");
    if (!exp) return false;
    return Date.now() < Number(exp);
}

/**
 * Clears the local session hint and tells the server to expire the HttpOnly cookie.
 */
export async function logout(): Promise<void> {
    localStorage.removeItem("gh_session_exp");
    await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
    });
}

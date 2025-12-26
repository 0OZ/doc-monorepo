"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login(username, password);
            router.push("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm">
                <div className="rounded-xl border bg-card p-6 shadow-lg">
                    {/* Header */}
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold text-foreground">Anmelden</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Leistungsnachweis-Portal
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="username"
                                className="mb-1.5 block text-sm font-medium text-foreground"
                            >
                                Benutzername
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Benutzername eingeben"
                                required
                                disabled={isLoading}
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1.5 block text-sm font-medium text-foreground"
                            >
                                Passwort
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Passwort eingeben"
                                required
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || !username || !password}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg
                                        className="h-4 w-4 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Anmelden...
                                </span>
                            ) : (
                                "Anmelden"
                            )}
                        </Button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 rounded-lg bg-muted/50 p-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Demo-Zugangsdaten:
                        </p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <p>
                                <span className="font-medium">Admin:</span> admin / admin123
                            </p>
                            <p>
                                <span className="font-medium">Pflegekraft:</span> staff / staff123
                            </p>
                            <p>
                                <span className="font-medium">Klient:</span> client / client123
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

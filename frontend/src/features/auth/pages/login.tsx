import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authContext } from "@/features/auth/authContext";
import type { ApiError } from "@/shared/api/http";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authContext) return;

        const checkAuth = async () => {
            if (await authContext.isAuthenticated()) {
                navigate("/");
            }
        }
        checkAuth();
    }, [navigate]);

    if (!authContext) {
        return (
            <div className="w-full h-[calc(100vh-5rem)] flex items-center justify-center">
                <p className="text-red-500 text-xl">Authentication context is not available. Please try again later.</p>
            </div>
        );
    }
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)
        try {
            await authContext.login({ username, password })
            navigate("/")
        } catch (err) {
            const apiError = err as ApiError
            const errorMessage = (apiError.data ? apiError.data : (apiError.message ? apiError.message : "Login failed. Please check your credentials and try again.")) as string;
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <div className="w-full h-[calc(100vh-5rem)] flex items-center justify-center">
            <div className="w-full max-w-md p-4 border shadow-lg">
                <h1 className="text-3xl font-bold mb-8">Login Page</h1>
                <form onSubmit={handleLogin}>
                    <div className="mb-4 flex flex-row gap-2 items-center">
                        <label htmlFor="username">
                            Username:
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            className="p-2 border flex-1"
                            required
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="mb-4 flex flex-row gap-2 items-center">
                        <label htmlFor="password" className="flex">
                            Password:
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            required
                            className="p-2 border  flex-1"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-[rgb(252,184,58)] text-black font-bold text-xl p-2  disabled:bg-gray-400">
                        {isLoading ? "Logging in..." : "Login"}
                    </button>
                </form>
                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
        </div>
    )
}

export default Login;
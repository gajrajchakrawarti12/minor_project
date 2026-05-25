import { authContext } from "@/features/auth/authContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Header() {
    const navigate = useNavigate();
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState<{ username: string, role: string } | null>(null);

    useEffect(() => {
        if (!authContext) return;

        const checkAuth = async () => {
            if (await authContext.isAuthenticated()) {
                authContext.getCurrentUser().then((user) => {
                    if (user) {
                        setAuthenticated(true);
                        console.log("Authenticated user:", user);
                        setUser(({ username: user.username, role: user.roles?.[0] || "user" }));
                    } else {
                        setAuthenticated(false);
                        setUser(null);
                    }
                });
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

    return (
        <header className="w-full p-3 flex justify-between items-center border-b-2 border-gray-300 shadow-md bg-[rgb(255,225,188)]">
            <div onClick={() => window.location.replace("/")} className="cursor-pointer">
                <h1 className="font-bold text-xl text-black">Time Table Generator</h1>
            </div>
            <div>
                {authenticated && (
                    <>
                        {user?.role === "ROLE_ADMIN" ? (
                            <div className="flex items-center space-x-4">
                                <p className="cursor-pointer hover:underline font-semibold" onClick={() => window.location.replace("/departments")}>Departments</p>
                                <p className="cursor-pointer hover:underline font-semibold" onClick={() => window.location.replace("/teachers")}>Teachers</p>
                                <p className="cursor-pointer hover:underline font-semibold" onClick={() => window.location.replace("/batches")}>Batches</p>
                                <p className="cursor-pointer hover:underline font-semibold" onClick={() => window.location.replace("/subjects")}>Subjects</p>
                                <p className="cursor-pointer hover:underline font-semibold" onClick={() => window.location.replace("/rooms")}>Rooms</p>
                                <p className="cursor-pointer hover:underline font-semibold" onClick={() => window.location.replace("/timeslots")}>Time Slots</p>
                                <p className="cursor-pointer hover:underline font-semibold" onClick={() => window.location.replace("/timetable")}>Timetable</p>
                            </div>
                        ) : (
                            <>{user?.role === "ROLE_TEACHER" ? "Teacher" : "User"}: {user?.username}</>
                        )}
                    </>
                )}
            </div>
            <div className="space-x-4">
                {authenticated ? (
                    <div className="flex items-center space-x-4">
                        <p className="font-semibold shadow-md bg-white/80 border border-gray-300 p-1">{user?.username}</p>
                        <button className="bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 px-4 py-2 cursor-pointer" onClick={() => authContext.logout()}>
                            Logout
                        </button>
                    </div>
                ) : (
                    <>
                        <button className="bg-[rgb(252,184,58)] text-white hover:bg-[rgb(218,147,15)] focus:outline-none rounded-none focus:ring-2 focus:ring-blue-500 px-4 py-2 cursor-pointer" onClick={() => window.location.replace("/login")}>
                            Login
                        </button>
                        <button className="bg-green-500 text-white hover:bg-green-600 focus:outline-none focus:ring-2 rounded-none focus:ring-green-500 px-4 py-2 cursor-pointer" onClick={() => window.location.replace("/signup")}>
                            Sign Up
                        </button>
                    </>
                )}
            </div>
        </header>
    )
}

export default Header;
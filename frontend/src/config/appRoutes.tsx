import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'
import Login from '@/features/auth/pages/login';
import Signup from '@/features/auth/pages/signup';
import ProtectedRoutes from '@/config/protectedRoutes';
import { authContext, type AuthUser } from '@/features/auth/authContext';

function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCurrentUser = async () => {
      const user = await authContext.getCurrentUser();
      setCurrentUser(user);
    };

    void loadCurrentUser();
  }, []);

  const handleLogout = async () => {
    await authContext.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div>
      <h1>Home</h1>
      <p>Logged in as: {currentUser?.username ?? 'Unknown user'}</p>
      <p>Roles: {currentUser?.roles?.join(', ') ?? 'No roles'}</p>
      <button type="button" onClick={handleLogout}>Logout</button>
    </div>
  );
}

function About() {
  return <h1>About</h1>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Route>
      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes>
  )
}

export default AppRoutes;
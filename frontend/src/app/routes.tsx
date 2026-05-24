import { Routes, Route, Outlet } from 'react-router-dom'
import Login from '@/features/auth/pages/login';
import Signup from '@/features/auth/pages/signup';
import ProtectedRoutes from '@/app/ProtectedRoutes';
import Home from '@/features/home';
import Header from "@/shared/components/header";
import AppBackground from "@/shared/components/AppBackground";
import Departments from '@/features/departments';
import Teachers from '@/features/teachers';
import Batches from '@/features/batches';
import Subjects from '@/features/subjects';
import Rooms from '@/features/rooms';
import TimeTable from '@/features/timetable';
import TimeSlotPage from '@/features/timeslots';

function ProtectedLayout() {
  return (
    <AppBackground className="flex flex-wrap items-center justify-center p-4">
      <Header />
      <Outlet />
    </AppBackground>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<ProtectedRoutes />}>
        <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/timeslots" element={<TimeSlotPage />} />
            <Route path="/timetable" element={<TimeTable />} />
        </Route>
      </Route>
      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes>

  )
}

export default AppRoutes;
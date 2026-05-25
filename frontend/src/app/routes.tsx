import { Routes, Route } from 'react-router-dom'
import Login from '@/features/auth/pages/login';
import Signup from '@/features/auth/pages/signup';
import Header from "@/shared/components/header";
import NotFound from '@/shared/components/notFound';
import Home from '@/features/home';
import Departments from '@/features/departments';
import Teachers from '@/features/teachers';
import Batches from '@/features/batches';
import Subjects from '@/features/subjects';
import Rooms from '@/features/rooms';
import TimeTable from '@/features/timetable';
import TimeSlotPage from '@/features/timeslots';

function AppRoutes() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="/subjects" element={<Subjects />} />
         <Route path="/rooms" element={<Rooms />} />
        <Route path="/timeslots" element={<TimeSlotPage />} />
        <Route path="/timetable" element={<TimeTable />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default AppRoutes;
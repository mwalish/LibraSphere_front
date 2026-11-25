import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PublicLayout, StaffLayout } from "./components/Layout";
import { Skeleton } from "./components/ui";
import { useAuth } from "./context/AuthContext";
import BookDetail from "./pages/BookDetail";
import Home from "./pages/Home";
import { Login, Register } from "./pages/Auth";
import Me from "./pages/Me";
import Search from "./pages/Search";
import Board from "./pages/staff/Board";
import ManageCatalog from "./pages/staff/ManageCatalog";
import Desk from "./pages/staff/Desk";
import Members from "./pages/staff/Members";
import Reports from "./pages/staff/Reports";

function RequireAuth({ staff, children }) {
  const { user, ready, isStaff } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="p-10"><Skeleton className="h-8 w-56" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (staff && !isStaff) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="book/:id" element={<BookDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="me" element={<RequireAuth><Me /></RequireAuth>} />
      </Route>
      <Route path="staff" element={<RequireAuth staff><StaffLayout /></RequireAuth>}>
        <Route index element={<Board />} />
        <Route path="desk" element={<Desk />} />
        <Route path="catalog" element={<ManageCatalog />} />
        <Route path="members" element={<Members />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import TeacherDashboard from "./pages/TeacherDashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/student-dashboard"
          element={<StudentDashboard />}
        />
        <Route 
          path="/teacher-dashboard" 
          element={<TeacherDashboard />} 
        />
        <Route 
          path="/admin-dashboard" 
          element={<AdminDashboard />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
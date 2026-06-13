import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles.css";

import Landing from "./pages/Landing.jsx";
import Register from "./pages/Register.jsx";
import FrameGenerator from "./pages/FrameGenerator.jsx";
import ProofSubmission from "./pages/ProofSubmission.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Terms from "./pages/terms.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/frame" element={<FrameGenerator />} />
        <Route path="/submit" element={<ProofSubmission />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
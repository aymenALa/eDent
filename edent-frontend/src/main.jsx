import "./index.css";
import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { IS_DEMO_MODE, getAuthUser } from "./utils/api";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const DemoAccess = lazy(() => import("./pages/DemoAccess"));
const AdminHome = lazy(() => import("./components/admin/AdminHome"));
const ProfHome = lazy(() => import("./components/prof/ProfHome"));
const StudentHome = lazy(() => import("./components/student/StudentHome"));
const Login = lazy(() => import("./components/auth/Login"));
const Register = lazy(() => import("./components/auth/Register"));
const NotFound404 = lazy(() => import("./components/auth/NotFound404"));
const ResetPwd = lazy(() => import("./components/auth/ResetPwd"));
const VerifyCode = lazy(() => import("./components/auth/VerifyCode"));
const CodeActivation = lazy(() => import("./components/auth/CodeActivation"));

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
    <div
      className="h-8 w-8 animate-spin rounded-full border-2 border-[#0F766E] border-t-transparent"
      role="status"
      aria-label="Loading view"
    />
  </div>
);

export const AppRoutes = () => {
  const userlogin = getAuthUser();
  const email = JSON.parse(localStorage.getItem("email") || "null");
  const code = JSON.parse(localStorage.getItem("code") || "null");
  const role = userlogin ? userlogin.role : null;

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {userlogin ? (
          <>
            {role === "admin" && <Route path="/admin" element={<AdminHome />} />}
            {role === "professor" && (
              <Route path="/professor/:componentName" element={<ProfHome />} />
            )}
            {role === "professor" && (
              <Route path="/professor" element={<Navigate replace to="/professor/dashboard" />} />
            )}
            {role === "student" && <Route path="/student" element={<StudentHome />} />}

            {role !== "admin" && <Route path="/admin" element={<Navigate replace to={`/${role}`} />} />}
            {role !== "professor" && (
              <Route path="/professor" element={<Navigate replace to={`/${role}`} />} />
            )}
            {role !== "professor" && (
              <Route path="/professor/:componentName" element={<Navigate replace to={`/${role}`} />} />
            )}
            {role !== "student" && (
              <Route path="/student" element={<Navigate replace to={`/${role}`} />} />
            )}

            <Route path="/login" element={<Navigate replace to={`/${role}`} />} />
            <Route path="/login/*" element={<Navigate replace to={`/${role}`} />} />
            <Route path="/register" element={<Navigate replace to={`/${role}`} />} />
          </>
        ) : (
          <>
            <Route path="/admin" element={<Navigate replace to="/login" />} />
            <Route path="/professor" element={<Navigate replace to="/login" />} />
            <Route path="/professor/:componentName" element={<Navigate replace to="/login" />} />
            <Route path="/student" element={<Navigate replace to="/login" />} />
          </>
        )}

        {!userlogin && IS_DEMO_MODE && <Route path="/demo" element={<DemoAccess />} />}
        {!userlogin && <Route path="/login" element={IS_DEMO_MODE ? <DemoAccess /> : <Login />} />}
        {userlogin && IS_DEMO_MODE && (
          <Route path="/demo" element={<Navigate replace to={role === "professor" ? "/professor/dashboard" : `/${role}`} />} />
        )}
        {!userlogin && <Route path="/login/activationcode" element={<CodeActivation />} />}
        {!userlogin && email && <Route path="/login/verifycode" element={<VerifyCode />} />}
        {!userlogin && code && <Route path="/login/resetpwd" element={<ResetPwd />} />}
        {!userlogin && <Route path="/register" element={<Register />} />}
        <Route path="*" element={<NotFound404 />} />
      </Routes>
    </Suspense>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>
);

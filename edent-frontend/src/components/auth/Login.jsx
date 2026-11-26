import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import { API_BASE, setAuthUser } from "../../utils/api";

const Login = () => {
  const [user, setUser] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const handleInput = (e) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (err) setErr("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!user.email.trim() || !user.password) {
      setErr("Please enter both your email address and password.");
      return;
    }
    setSubmitting(true);
    setErr("");
    try {
      const res = await axios.post(`${API_BASE}/users/login`, user);
      setAuthUser(res.data);
      toast.success(res.data.message || "Authentication successful");
      const role = res.data.role;
      if (role === "professor") {
        window.location = `${role}/profil`;
      } else {
        window.location = role;
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Invalid email or password.";
      setErr(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome to eDent"
      subtitle="Sign in to access your academic workspace. Administrators, professors, and students all sign in from this page."
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormField id="login-email" label="Email address" required>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="email"
            value={user.email}
            onChange={handleInput}
            placeholder="name@university.edu"
            required
            className="block w-full rounded-lg border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#0F766E] focus:ring-[#0F766E]"
          />
        </FormField>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
              Password <span className="text-red-600">*</span>
            </label>
            <Link
              to="/login/activationcode"
              className="text-xs font-medium text-[#0F766E] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              value={user.password}
              onChange={handleInput}
              placeholder="Enter your password"
              required
              className="block w-full rounded-lg border border-[#E2E8F0] py-3 pl-4 pr-11 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#0F766E] focus:ring-[#0F766E]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600"
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {err && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
            {err}
          </p>
        )}

        <Button type="submit" loading={submitting} className="w-full py-3 text-sm font-semibold">
          Sign in
        </Button>

        <div className="border-t border-[#E2E8F0] pt-4 text-center text-xs text-slate-600">
          New faculty member?{" "}
          <Link to="/register" className="font-semibold text-[#0F766E] hover:underline">
            Register a professor account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;

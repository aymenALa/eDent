import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import { API_BASE } from "../../utils/api";

const INITIAL = {
  email: "",
  userName: "",
  password: "",
  firstName: "",
  lastName: "",
  grade: "",
};

const Register = () => {
  const [user, setUser] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleInput = (e) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (err) setErr("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!user.firstName.trim() || !user.lastName.trim() || !user.userName.trim() || !user.email.trim() || !user.password) {
      setErr("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    setErr("");
    setSuccessMsg("");
    try {
      const res = await axios.post(`${API_BASE}/users/register/professor`, user);
      const msg = res.data.message || "Registration submitted. An administrator must activate your account.";
      setSuccessMsg(msg);
      toast.success(msg);
      setUser(INITIAL);
    } catch (error) {
      const msg = error.response?.data?.message || "Could not create account.";
      setErr(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Professor registration"
      subtitle={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-[#0F766E] hover:underline">
            Sign in here
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="reg-firstName" label="First name" required>
            <input
              id="reg-firstName"
              type="text"
              name="firstName"
              value={user.firstName}
              onChange={handleInput}
              required
              className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
            />
          </FormField>
          <FormField id="reg-lastName" label="Last name" required>
            <input
              id="reg-lastName"
              type="text"
              name="lastName"
              value={user.lastName}
              onChange={handleInput}
              required
              className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
            />
          </FormField>
        </div>

        <FormField id="reg-userName" label="Username" required>
          <input
            id="reg-userName"
            type="text"
            name="userName"
            value={user.userName}
            onChange={handleInput}
            required
            className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
          />
        </FormField>

        <FormField id="reg-email" label="Email address" required>
          <input
            id="reg-email"
            type="email"
            name="email"
            value={user.email}
            onChange={handleInput}
            required
            className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
          />
        </FormField>

        <FormField id="reg-password" label="Password" required>
          <input
            id="reg-password"
            type="password"
            name="password"
            value={user.password}
            onChange={handleInput}
            required
            className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
          />
        </FormField>

        <FormField id="reg-grade" label="Academic grade">
          <input
            id="reg-grade"
            type="text"
            name="grade"
            value={user.grade}
            onChange={handleInput}
            placeholder="e.g. Associate Professor"
            className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
          />
        </FormField>

        {err && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {err}
          </p>
        )}
        {successMsg && (
          <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {successMsg}
          </p>
        )}

        <Button type="submit" loading={submitting} className="w-full py-2.5">
          Create professor account
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Register;

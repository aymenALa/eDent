import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import { API_BASE } from "../../utils/api";

const CodeActivation = () => {
  const [user, setUser] = useState({ email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!user.email.trim()) {
      setErr("Please enter your email address.");
      toast.error("Please enter your email address.");
      return;
    }
    setSubmitting(true);
    setErr("");
    try {
      const res = await axios.post(`${API_BASE}/users/codeactivation`, user);
      localStorage.setItem("email", JSON.stringify(user.email));
      toast.success(res.data.message);
      setTimeout(() => {
        window.location = "/login/verifycode";
      }, 1500);
    } catch (error) {
      const msg = error.response?.data?.message || "Could not send the reset code.";
      setErr(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Password recovery"
      subtitle="Enter your registered email address to receive a one-time verification code."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField id="reset-email" label="Email address" required>
          <input
            id="reset-email"
            type="email"
            name="email"
            value={user.email}
            onChange={(e) => {
              setUser({ email: e.target.value });
              if (err) setErr("");
            }}
            placeholder="name@university.edu"
            required
            className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2.5 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
          />
        </FormField>

        {err && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {err}
          </p>
        )}

        <Button type="submit" loading={submitting} className="w-full py-2.5">
          Send verification code
        </Button>

        <div className="text-center">
          <Link to="/login" className="text-xs font-medium text-[#0F766E] hover:underline">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default CodeActivation;

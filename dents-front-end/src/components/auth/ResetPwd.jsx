import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import { API_BASE } from "../../utils/api";

const ResetPwd = () => {
  const email = JSON.parse(localStorage.getItem("email"));
  const code = JSON.parse(localStorage.getItem("code"));
  const [pwd, setPwd] = useState("");
  const [pwd1, setPwd1] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !code) {
      toast.error("Your reset session is missing. Start the password reset again.");
      return;
    }
    if (!pwd) {
      setErr("Enter a new password.");
      return;
    }
    if (pwd !== pwd1) {
      setErr("The two passwords must be identical.");
      return;
    }
    setSubmitting(true);
    setErr("");
    try {
      const res = await axios.post(`${API_BASE}/users/resetpwd`, {
        email,
        code,
        password: pwd,
      });
      toast.success(res.data.message);
      localStorage.removeItem("email");
      localStorage.removeItem("code");
      setTimeout(() => {
        window.location = "/login";
      }, 1500);
    } catch (error) {
      const msg = error.response?.data?.message || "Could not reset the password.";
      setErr(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong new password for your account.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField id="new-pwd" label="New password" required>
          <input
            id="new-pwd"
            type="password"
            value={pwd}
            onChange={(e) => {
              setPwd(e.target.value);
              if (err) setErr("");
            }}
            placeholder="Enter new password"
            className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2.5 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
          />
        </FormField>

        <FormField id="confirm-pwd" label="Confirm password" required>
          <input
            id="confirm-pwd"
            type="password"
            value={pwd1}
            onChange={(e) => {
              setPwd1(e.target.value);
              if (err) setErr("");
            }}
            placeholder="Confirm new password"
            className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2.5 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
          />
        </FormField>

        {err && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {err}
          </p>
        )}

        <Button type="submit" loading={submitting} className="w-full py-2.5">
          Reset password
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

export default ResetPwd;

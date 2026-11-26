import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import { API_BASE } from "../../utils/api";

const VerifyCode = () => {
  const email = JSON.parse(localStorage.getItem("email"));
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Start the password reset again and enter your email.");
      return;
    }
    if (!code.trim()) {
      setErr("Enter the verification code sent to your email.");
      toast.error("Enter the code sent to your email.");
      return;
    }
    setSubmitting(true);
    setErr("");
    try {
      const res = await axios.post(`${API_BASE}/users/verifiercode`, { email, code });
      localStorage.setItem("code", JSON.stringify(code));
      toast.success(res.data.message);
      setTimeout(() => {
        window.location = "/login/resetpwd";
      }, 1000);
    } catch (error) {
      const msg = error.response?.data?.message || "Could not verify this code.";
      setErr(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Verify code"
      subtitle="Enter the activation code sent to your email address."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField id="verify-code" label="Verification code" required>
          <input
            id="verify-code"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (err) setErr("");
            }}
            placeholder="Enter code"
            className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2.5 text-center text-lg tracking-widest focus:border-[#0F766E] focus:ring-[#0F766E]"
          />
        </FormField>

        {err && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {err}
          </p>
        )}

        <Button type="submit" loading={submitting} className="w-full py-2.5">
          Verify code
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

export default VerifyCode;

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCircleInfo,
  faGraduationCap,
  faShieldHalved,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import AuthLayout from "../layouts/AuthLayout";
import { enterDemoWorkspace } from "../utils/api";

const DEMO_ROLES = [
  {
    role: "admin",
    title: "Explore as Administrator",
    account: "admin.synth@test.local",
    description: "Manage professor accounts, activation states, and directory metrics.",
    icon: faShieldHalved,
  },
  {
    role: "professor",
    title: "Explore as Professor",
    account: "prof.synth@test.local",
    description:
      "Review student submissions, manage cohorts, PWs, and export branded PDF reports.",
    icon: faUserTie,
  },
  {
    role: "student",
    title: "Explore as Student",
    account: "student.synth@test.local (Salma El Fassi)",
    description:
      "Complete pending practical work in the Tooth Analysis Studio with 9-landmark geometry.",
    icon: faGraduationCap,
  },
];

const DemoAccess = () => {
  const [loadingRole, setLoadingRole] = useState("");
  const [error, setError] = useState("");

  const handleSelectRole = async (role) => {
    setLoadingRole(role);
    setError("");
    try {
      await enterDemoWorkspace(role);
    } catch (err) {
      setError(err?.message || "Could not initialize browser demo storage.");
      setLoadingRole("");
    }
  };

  return (
    <AuthLayout
      title="Try the eDent live demo"
      subtitle="Select any academic role below to explore the platform with synthetic data saved locally in your browser."
    >
      <div
        role="status"
        className="mb-5 flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50/70 px-3.5 py-3 text-xs text-teal-900"
      >
        <FontAwesomeIcon
          icon={faCircleInfo}
          className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]"
          aria-hidden="true"
        />
        <div>
          <span className="font-semibold">
            Interactive Demo — Data and changes are stored locally in your browser.
          </span>{" "}
          No password or external server required (React + IndexedDB).
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {DEMO_ROLES.map((item) => {
          const isBusy = loadingRole === item.role;
          return (
            <button
              key={item.role}
              type="button"
              disabled={Boolean(loadingRole)}
              onClick={() => handleSelectRole(item.role)}
              data-testid={`demo-role-${item.role}`}
              className="group flex w-full items-center justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition-all hover:border-[#0F766E] hover:bg-teal-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] disabled:opacity-60"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]">
                  <FontAwesomeIcon icon={item.icon} className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] group-hover:text-[#0F766E]">
                    {isBusy ? "Loading workspace..." : item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">{item.account}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                </div>
              </div>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#0F766E]"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </AuthLayout>
  );
};

export default DemoAccess;

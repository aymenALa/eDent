import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import ConfirmDialog from "./ConfirmDialog";
import DemoAnnouncement from "../demo/DemoAnnouncement";
import {
  IS_DEMO_MODE,
  enterDemoWorkspace,
  getAuthUser,
  resetDemoWorkspaceData,
  useDemoMode,
} from "../../utils/api";

const ROLE_OPTIONS = [
  { key: "admin", label: "Admin" },
  { key: "professor", label: "Professor" },
  { key: "student", label: "Student" },
];

const DemoBanner = () => {
  const demoReadOnly = useDemoMode();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [switchingRole, setSwitchingRole] = useState("");
  const currentUser = getAuthUser();

  if (IS_DEMO_MODE) {
    const handleSwitch = async (role) => {
      if (currentUser?.role === role || switchingRole) return;
      setSwitchingRole(role);
      try {
        await enterDemoWorkspace(role);
      } catch (err) {
        toast.error(err?.message || "Could not switch demo workspace.");
        setSwitchingRole("");
      }
    };

    const handleReset = async () => {
      setResetting(true);
      try {
        await resetDemoWorkspaceData();
        setConfirmReset(false);
        window.location.reload();
      } catch (err) {
        toast.error(err?.message || "Could not reset demo data.");
        setResetting(false);
      }
    };

    return (
      <>
        <div
          role="status"
          data-testid="interactive-demo-banner"
          className="mb-5 flex flex-col gap-3 rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-xs text-teal-950 shadow-sm xl:flex-row xl:items-center xl:justify-between"
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <FontAwesomeIcon
              icon={faCircleInfo}
              className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="font-semibold">
                Interactive Demo — Data and changes are stored locally in your browser.
              </span>{" "}
              <span className="text-teal-900/80">
                Switch roles anytime or reset to restore the initial dataset.
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Switch demo role"
              className="inline-flex shrink-0 flex-wrap items-center rounded-lg border border-teal-200 bg-white p-0.5"
            >
              {ROLE_OPTIONS.map((item) => {
                const active = currentUser?.role === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={active || Boolean(switchingRole)}
                    onClick={() => handleSwitch(item.key)}
                    data-testid={`switch-role-${item.key}`}
                    className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-[#0F766E] text-white"
                        : "text-slate-600 hover:bg-teal-50 hover:text-[#0F766E]"
                    }`}
                  >
                    {switchingRole === item.key ? "..." : item.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              data-testid="reset-demo-btn"
              className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0F766E] transition-colors hover:bg-teal-100/60"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="h-3 w-3" aria-hidden="true" />
              Reset demo data
            </button>
          </div>
        </div>

        <ConfirmDialog
          open={confirmReset}
          onClose={() => setConfirmReset(false)}
          onConfirm={handleReset}
          loading={resetting}
          title="Reset demo data?"
          message="This will clear your local browser changes and restore the initial eDent synthetic dataset."
          confirmLabel="Reset demo data"
          variant="danger"
        />

        <DemoAnnouncement />
      </>
    );
  }

  if (!demoReadOnly) return null;

  return (
    <div
      role="status"
      data-testid="demo-readonly-banner"
      className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs text-amber-900 shadow-sm"
    >
      <FontAwesomeIcon
        icon={faCircleInfo}
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
        aria-hidden="true"
      />
      <div>
        <span className="font-semibold">Public Demo Mode (Read-Only):</span>{" "}
        Explore all three roles, test landmark placement locally in the Tooth Analysis Studio, and
        export PDF reports. Saving or deleting records is disabled in the live demo.
      </div>
    </div>
  );
};

export default DemoBanner;

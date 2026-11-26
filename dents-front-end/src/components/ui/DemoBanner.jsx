import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { useDemoMode } from "../../utils/api";

const DemoBanner = () => {
  const demoReadOnly = useDemoMode();
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

import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faDatabase,
  faTooth,
  faUnlockKeyhole,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../ui/Button";

const FULL_STACK_REPO_URL = "https://github.com/aymenALa/eDent/tree/ui-enhancement";

const DemoWelcomeCard = ({ open, onDismiss }) => {
  const navigate = useNavigate();
  if (!open) return null;

  const handleExplore = () => {
    onDismiss();
    navigate("/demo");
  };

  return (
    <aside
      aria-label="Interactive demo welcome"
      data-testid="demo-welcome-card"
      className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[380px] motion-safe:transition-all motion-safe:duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-[#0F766E]">
          INTERACTIVE EXPERIENCE
        </span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close demo announcement"
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <h2 className="mt-2.5 text-base font-bold text-[#0F172A]">Welcome to the eDent demo</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
        Experience eDent without creating an account. Explore every workspace, perform tooth
        analysis and discover the platform at your own pace.
      </p>

      <ul className="mt-3.5 space-y-2 border-y border-slate-100 py-3 text-xs text-slate-700">
        <li className="flex items-center gap-2.5">
          <FontAwesomeIcon icon={faUnlockKeyhole} className="h-3.5 w-3.5 text-[#0F766E]" aria-hidden="true" />
          <span>No login required.</span>
        </li>
        <li className="flex items-center gap-2.5">
          <FontAwesomeIcon icon={faTooth} className="h-3.5 w-3.5 text-[#0F766E]" aria-hidden="true" />
          <span>Synthetic data, real interactions.</span>
        </li>
        <li className="flex items-center gap-2.5">
          <FontAwesomeIcon icon={faDatabase} className="h-3.5 w-3.5 text-[#0F766E]" aria-hidden="true" />
          <span>Changes saved in your browser.</span>
        </li>
      </ul>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        This interactive demonstration runs entirely in your browser. The complete application
        includes a Spring Boot backend, MySQL database and JWT authentication.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Button size="sm" onClick={handleExplore} className="flex-1">
          Explore the demo
        </Button>
        <a
          href={FULL_STACK_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
        >
          <span>View full-stack project</span>
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
};

DemoWelcomeCard.propTypes = {
  open: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default DemoWelcomeCard;

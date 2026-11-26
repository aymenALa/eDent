import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BrandLogo from "../components/ui/BrandLogo";

const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A] lg:grid lg:grid-cols-12">
    {/* Branded academic side panel (desktop only) */}
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#134E4A] px-12 py-12 text-white lg:col-span-5 lg:flex xl:px-16">
      {/* Abstract dental geometry background */}
      <svg
        className="pointer-events-none absolute -bottom-16 -right-16 h-96 w-96 opacity-10"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="88" stroke="#14B8A6" strokeWidth="1.5" strokeDasharray="6 6" />
        <path
          d="M65 72C65 55 78 44 92 44C99 44 103 47 106 51C109 47 113 44 120 44C134 44 147 55 147 72C147 96 135 114 129 142C126 155 121 172 111 172C106 172 105 154 106 154C107 154 106 172 101 172C91 172 86 155 83 142C77 114 65 96 65 72Z"
          stroke="#FFFFFF"
          strokeWidth="2.5"
        />
        <path d="M80 95L106 78L132 95" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="80" cy="95" r="4" fill="#14B8A6" />
        <circle cx="106" cy="78" r="4.5" fill="#FFFFFF" />
        <circle cx="132" cy="95" r="4" fill="#14B8A6" />
      </svg>

      <div className="relative z-10 flex items-center justify-between">
        <Link to="/" aria-label="eDent home">
          <BrandLogo
            variant="primary"
            tone="dark"
            subtitle="Dental Education & Practical Work"
          />
        </Link>
      </div>

      <div className="relative z-10 my-auto max-w-md space-y-6 py-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-teal-100">
          Academic Dental Training Workspace
        </div>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
          Structured practical-work training for dental faculties.
        </h2>
        <p className="text-sm leading-relaxed text-teal-100/90">
          Coordinate student cohorts, tooth preparation assignments, front and side landmark
          geometry review, and academic PDF reporting in one unified workspace.
        </p>
        <ul className="space-y-3.5 pt-2 text-sm text-teal-100">
          <li className="flex items-center gap-3">
            <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 shrink-0 text-[#14B8A6]" aria-hidden="true" />
            <span>Interactive front &amp; side tooth-image landmark studio</span>
          </li>
          <li className="flex items-center gap-3">
            <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 shrink-0 text-[#14B8A6]" aria-hidden="true" />
            <span>Unified portal for administrators, professors &amp; students</span>
          </li>
          <li className="flex items-center gap-3">
            <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 shrink-0 text-[#14B8A6]" aria-hidden="true" />
            <span>Prototype educational scoring &amp; PDF evaluation reports</span>
          </li>
        </ul>
      </div>

      <p className="relative z-10 text-xs text-teal-200/80">
        Educational prototype environment — not intended for clinical diagnosis.
      </p>
    </aside>

    {/* Auth Form Region */}
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8 lg:col-span-7">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="lg:hidden" aria-label="eDent home">
            <BrandLogo variant="primary" tone="light" subtitle="Dental Education Platform" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 transition-colors hover:text-[#0F766E]"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" aria-hidden="true" />
            Back to home
          </Link>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-7 shadow-sm sm:p-10">
          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] sm:text-3xl">
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </main>

    <ToastContainer position="bottom-right" autoClose={3000} theme="light" />
  </div>
);

AuthLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.node,
  children: PropTypes.node.isRequired,
};

export default AuthLayout;

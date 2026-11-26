import PropTypes from "prop-types";

const TONES = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  teal: "bg-teal-50 text-[#0F766E] border-teal-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
};

const DOTS = {
  success: "bg-emerald-600",
  warning: "bg-amber-600",
  danger: "bg-red-600",
  teal: "bg-[#0F766E]",
  neutral: "bg-slate-500",
};

const StatusBadge = ({ tone = "neutral", children, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone] || TONES.neutral} ${className}`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone] || DOTS.neutral}`} aria-hidden="true" />
    {children}
  </span>
);

StatusBadge.propTypes = {
  tone: PropTypes.oneOf(["success", "warning", "danger", "teal", "neutral"]),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default StatusBadge;

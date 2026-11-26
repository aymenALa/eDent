import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const StatCard = ({ label, value, icon, hint }) => (
  <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[#0F172A]">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]">
          <FontAwesomeIcon icon={icon} className="h-4 w-4" aria-hidden="true" />
        </div>
      )}
    </div>
  </div>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.object,
  hint: PropTypes.string,
};

export default StatCard;

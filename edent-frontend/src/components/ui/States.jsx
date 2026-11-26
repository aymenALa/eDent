import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faInbox } from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";

export const LoadingState = ({ label = "Loading data..." }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-[#E2E8F0] bg-white py-12 text-center">
    <div
      className="h-7 w-7 animate-spin rounded-full border-2 border-[#0F766E] border-t-transparent"
      role="status"
      aria-label={label}
    />
    <p className="mt-3 text-sm text-slate-500">{label}</p>
  </div>
);

LoadingState.propTypes = {
  label: PropTypes.string,
};

export const EmptyState = ({ title = "No records found", description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-white px-6 py-12 text-center">
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
      <FontAwesomeIcon icon={faInbox} className="h-5 w-5" aria-hidden="true" />
    </div>
    <h3 className="mt-3 text-sm font-semibold text-[#0F172A]">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

EmptyState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.node,
};

export const ErrorState = ({ title = "Unable to load data", message, onRetry }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/60 px-6 py-10 text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
      <FontAwesomeIcon icon={faCircleExclamation} className="h-5 w-5" aria-hidden="true" />
    </div>
    <h3 className="mt-3 text-sm font-semibold text-red-900">{title}</h3>
    {message && <p className="mt-1 max-w-md text-xs text-red-700">{message}</p>}
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
        Try again
      </Button>
    )}
  </div>
);

ErrorState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
};

import PropTypes from "prop-types";

const VARIANTS = {
  primary:
    "bg-[#0F766E] text-white hover:bg-[#134E4A] border-transparent shadow-sm",
  secondary:
    "bg-white text-slate-700 border-[#E2E8F0] hover:bg-slate-50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 border-transparent shadow-sm",
  ghost:
    "bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

const Button = ({
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
    {...props}
  >
    {loading && (
      <span
        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
      />
    )}
    {children}
  </button>
);

Button.propTypes = {
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  variant: PropTypes.oneOf(["primary", "secondary", "danger", "ghost"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Button;

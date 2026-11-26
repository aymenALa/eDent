import PropTypes from "prop-types";

const FormField = ({ id, label, error, hint, required = false, children, className = "" }) => (
  <div className={className}>
    <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-700">
      {label}
      {required && <span className="ml-0.5 text-red-600">*</span>}
    </label>
    {children}
    {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

FormField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  hint: PropTypes.string,
  required: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default FormField;

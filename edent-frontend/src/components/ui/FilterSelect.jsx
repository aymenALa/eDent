import PropTypes from "prop-types";

const FilterSelect = ({ id, label, value, onChange, options, className = "" }) => (
  <div className={className}>
    <label htmlFor={id} className="sr-only">
      {label}
    </label>
    <select
      id={id}
      aria-label={label}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 pl-3 pr-9 text-sm text-[#0F172A] focus:border-[#0F766E] focus:ring-[#0F766E]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

FilterSelect.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  className: PropTypes.string,
};

export default FilterSelect;

import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";

const SearchInput = ({ id, label = "Search", value, onChange, placeholder = "Search...", className = "" }) => (
  <div className={`relative ${className}`}>
    <label htmlFor={id} className="sr-only">
      {label}
    </label>
    <FontAwesomeIcon
      icon={faMagnifyingGlass}
      className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
      aria-hidden="true"
    />
    <input
      id={id}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 pl-9 pr-8 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#0F766E] focus:ring-[#0F766E]"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label="Clear search"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
      >
        <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    )}
  </div>
);

SearchInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
};

export default SearchInput;

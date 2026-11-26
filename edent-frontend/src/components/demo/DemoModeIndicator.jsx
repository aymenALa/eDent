import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

const DemoModeIndicator = ({ visible, onOpen }) => {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="demo-mode-pill"
      aria-label="Open demo mode information"
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-[#0F766E]/25 bg-white/95 px-3.5 py-2 text-xs font-semibold text-[#0F766E] shadow-md backdrop-blur-sm transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
    >
      <FontAwesomeIcon icon={faCircleInfo} className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Demo mode</span>
    </button>
  );
};

DemoModeIndicator.propTypes = {
  visible: PropTypes.bool.isRequired,
  onOpen: PropTypes.func.isRequired,
};

export default DemoModeIndicator;

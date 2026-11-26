import { useState } from "react";
import PropTypes from "prop-types";
import { IS_DEMO_MODE } from "../../utils/api";
import DemoModeIndicator from "./DemoModeIndicator";
import DemoWelcomeCard from "./DemoWelcomeCard";

const DISMISS_KEY = "edent_demo_welcome_dismissed";

const readDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
};

const DemoAnnouncement = ({ autoShow = false }) => {
  const [open, setOpen] = useState(() => (autoShow ? !readDismissed() : false));

  if (!IS_DEMO_MODE) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // ignore storage write failures
    }
    setOpen(false);
  };

  return (
    <>
      <DemoWelcomeCard open={open} onDismiss={handleDismiss} />
      <DemoModeIndicator visible={!open} onOpen={() => setOpen(true)} />
    </>
  );
};

DemoAnnouncement.propTypes = {
  autoShow: PropTypes.bool,
};

export default DemoAnnouncement;

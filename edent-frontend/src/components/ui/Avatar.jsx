import { useState } from "react";
import PropTypes from "prop-types";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

const Avatar = ({ photo, firstName = "", lastName = "", size = "md", className = "" }) => {
  const [failed, setFailed] = useState(false);
  const initials = `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase() || "ED";
  const hasPhoto = Boolean(photo && photo !== "null" && !failed);
  const src = hasPhoto
    ? photo.startsWith("data:")
      ? photo
      : `data:image/png;base64,${photo}`
    : null;

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`.trim() || "Profile avatar"}
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full border border-[#E2E8F0] object-cover ${SIZES[size] || SIZES.md} ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={`${firstName} ${lastName}`.trim() || "Profile avatar"}
      className={`flex shrink-0 items-center justify-center rounded-full border border-teal-200 bg-teal-50 font-semibold text-[#0F766E] ${SIZES[size] || SIZES.md} ${className}`}
    >
      {initials}
    </div>
  );
};

Avatar.propTypes = {
  photo: PropTypes.string,
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  className: PropTypes.string,
};

export default Avatar;

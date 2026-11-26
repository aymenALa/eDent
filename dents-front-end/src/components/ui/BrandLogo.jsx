import PropTypes from "prop-types";

const BrandMark = ({ size = 36, tone = "light" }) => {
  const isDarkBg = tone === "dark";
  const boxFill = isDarkBg ? "rgba(255,255,255,0.12)" : "#0F766E";
  const boxStroke = isDarkBg ? "rgba(255,255,255,0.18)" : "none";
  const toothStroke = "#FFFFFF";
  const accentColor = "#14B8A6";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="40" height="40" rx="10" fill={boxFill} stroke={boxStroke} />
      {/* Geometric tooth silhouette */}
      <path
        d="M12.5 13.5C12.5 10.7 14.8 9 17.3 9C18.6 9 19.4 9.5 20 10.1C20.6 9.5 21.4 9 22.7 9C25.2 9 27.5 10.7 27.5 13.5C27.5 17.5 25.4 20.6 24.4 25.2C23.9 27.6 23.1 30.8 21.4 30.8C20.4 30.8 20.2 27.5 20 27.5C19.8 27.5 19.6 30.8 18.6 30.8C16.9 30.8 16.1 27.6 15.6 25.2C14.6 20.6 12.5 17.5 12.5 13.5Z"
        stroke={toothStroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Precision landmark measurement polyline */}
      <path
        d="M15 17.5L20 14.5L25 17.5"
        stroke={accentColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="17.5" r="1.5" fill={accentColor} />
      <circle cx="20" cy="14.5" r="1.6" fill="#FFFFFF" />
      <circle cx="25" cy="17.5" r="1.5" fill={accentColor} />
    </svg>
  );
};

BrandMark.propTypes = {
  size: PropTypes.number,
  tone: PropTypes.oneOf(["light", "dark"]),
};

const BrandLogo = ({ variant = "primary", tone = "light", subtitle, className = "" }) => {
  if (variant === "icon") {
    return <BrandMark size={38} tone={tone} />;
  }

  const isSidebar = variant === "sidebar";
  const isDarkBg = tone === "dark";
  const markSize = isSidebar ? 36 : 40;
  const titleColor = isDarkBg ? "text-white" : "text-[#0F172A]";
  const subColor = isDarkBg ? "text-teal-200" : "text-slate-500";

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <BrandMark size={markSize} tone={tone} />
      <div className="leading-tight">
        <span className={`block font-bold tracking-tight ${isSidebar ? "text-base" : "text-lg"} ${titleColor}`}>
          eDent
        </span>
        {subtitle && (
          <span
            className={`block font-medium ${
              isSidebar ? "text-[11px] uppercase tracking-wider" : "text-xs"
            } ${subColor}`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

BrandLogo.propTypes = {
  variant: PropTypes.oneOf(["primary", "sidebar", "icon"]),
  tone: PropTypes.oneOf(["light", "dark"]),
  subtitle: PropTypes.string,
  className: PropTypes.string,
};

export default BrandLogo;

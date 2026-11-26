import PropTypes from "prop-types";

const PageHeader = ({ title, description, actions }) => (
  <div className="mb-6 flex flex-col gap-4 border-b border-[#E2E8F0] pb-5 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
  </div>
);

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.node,
};

export default PageHeader;

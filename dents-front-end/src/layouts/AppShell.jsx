import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faRightFromBracket, faXmark } from "@fortawesome/free-solid-svg-icons";
import Avatar from "../components/ui/Avatar";
import BrandLogo from "../components/ui/BrandLogo";
import DemoBanner from "../components/ui/DemoBanner";
import { clearAuthUser } from "../utils/api";

const AppShell = ({ roleLabel, pageTitle, navItems, user, onLogout, children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      clearAuthUser();
      window.location = "/";
    }
  };

  const renderNav = (closeOnSelect = false) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
        <BrandLogo variant="sidebar" subtitle={roleLabel} />
        {closeOnSelect && (
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label={`${roleLabel} navigation`} className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const baseClasses = `flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors duration-150 ${
            item.active
              ? "bg-teal-50 font-semibold text-[#0F766E]"
              : "font-medium text-slate-600 hover:bg-slate-100 hover:text-[#0F172A]"
          }`;
          const content = (
            <>
              <span className="flex w-5 shrink-0 items-center justify-center">
                <FontAwesomeIcon
                  icon={item.icon}
                  className={`h-4 w-4 ${item.active ? "text-[#0F766E]" : "text-slate-400"}`}
                  aria-hidden="true"
                />
              </span>
              <span className="truncate">{item.label}</span>
            </>
          );

          if (item.to) {
            return (
              <Link
                key={item.key}
                to={item.to}
                onClick={() => closeOnSelect && setDrawerOpen(false)}
                aria-current={item.active ? "page" : undefined}
                className={baseClasses}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                item.onClick?.();
                if (closeOnSelect) setDrawerOpen(false);
              }}
              aria-current={item.active ? "page" : undefined}
              className={baseClasses}
            >
              {content}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[#E2E8F0] p-3">
        {user && (
          <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar
              photo={user.photo}
              firstName={user.firstName}
              lastName={user.lastName}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#0F172A]">
                {`${user.firstName || ""} ${user.lastName || ""}`.trim() || roleLabel}
              </p>
              {user.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[40px] w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <span className="flex w-5 shrink-0 items-center justify-center">
            <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[#E2E8F0] bg-white lg:block">
        {renderNav(false)}
      </aside>

      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E2E8F0] bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            className="rounded-lg border border-[#E2E8F0] p-2 text-slate-600 hover:bg-slate-50"
          >
            <FontAwesomeIcon icon={faBars} className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2.5">
            <BrandLogo variant="icon" />
            <span className="text-sm font-semibold text-[#0F172A]">{pageTitle || "eDent"}</span>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          {roleLabel}
        </span>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-50 w-64 max-w-[80vw] border-r border-[#E2E8F0] bg-white shadow-xl">
            {renderNav(true)}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
          <DemoBanner />
          {children}
        </main>
      </div>
    </div>
  );
};

AppShell.propTypes = {
  roleLabel: PropTypes.string.isRequired,
  pageTitle: PropTypes.string,
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.object.isRequired,
      to: PropTypes.string,
      onClick: PropTypes.func,
      active: PropTypes.bool,
    })
  ).isRequired,
  user: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    photo: PropTypes.string,
  }),
  onLogout: PropTypes.func,
  children: PropTypes.node.isRequired,
};

export default AppShell;

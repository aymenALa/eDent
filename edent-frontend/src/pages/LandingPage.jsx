import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBars,
  faCheckCircle,
  faClipboardCheck,
  faFilePdf,
  faGraduationCap,
  faInfoCircle,
  faShieldHalved,
  faTooth,
  faUserTie,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import BrandLogo from "../components/ui/BrandLogo";
import DemoAnnouncement from "../components/demo/DemoAnnouncement";
import { IS_DEMO_MODE } from "../utils/api";

const SHOWCASE_TABS = [
  {
    key: "dashboard",
    label: "Professor Dashboard",
    caption: "Cohort KPIs, group distribution chart, quick actions, and searchable student directory.",
    image: "/showcase/prof-dashboard.png",
    alt: "eDent Professor Dashboard showing cohort KPIs and student directory",
  },
  {
    key: "submissions",
    label: "Submissions Center",
    caption: "Filterable directory of submitted student work across groups and practical assignments.",
    image: "/showcase/prof-submissions.png",
    alt: "eDent Professor Submissions Center listing submitted tooth analyses",
  },
  {
    key: "student",
    label: "Student Workspace",
    caption: "Assignment progress tracking, pending/submitted status, and read-only submission access.",
    image: "/showcase/student-dashboard.png",
    alt: "eDent Student Workspace with completion progress and assignment cards",
  },
  {
    key: "review",
    label: "Submission Review",
    caption: "Structured front and side image inspection, angle tables, prototype scores, and A4 PDF export.",
    image: "/showcase/submission-review.png",
    alt: "eDent Submission Review modal showing annotated images and angle table",
  },
];

const LandingPage = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeShowcase, setActiveShowcase] = useState("dashboard");

  useEffect(() => {
    const sections = document.querySelectorAll(".reveal-section");
    if (!("IntersectionObserver" in window)) {
      sections.forEach((s) => s.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const currentShowcase =
    SHOWCASE_TABS.find((tab) => tab.key === activeShowcase) || SHOWCASE_TABS[0];

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A]">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <a href="#top" aria-label="eDent home">
            <BrandLogo variant="primary" tone="light" subtitle="Dental Education Platform" />
          </a>

          <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
            <a
              href="#platform"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0F766E]"
            >
              Platform
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0F766E]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0F766E]"
            >
              How it works
            </a>
            <Link
              to={IS_DEMO_MODE ? "/demo" : "/login"}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#134E4A]"
            >
              {IS_DEMO_MODE ? "Try live demo" : "Sign in"}
              <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            className="rounded-lg border border-[#E2E8F0] p-2 text-slate-600 hover:bg-slate-50 md:hidden"
          >
            <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <nav
            aria-label="Mobile navigation"
            className="border-t border-[#E2E8F0] bg-white px-4 py-4 md:hidden"
          >
            <div className="flex flex-col space-y-3">
              <a
                href="#platform"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Platform
              </a>
              <a
                href="#features"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                How it works
              </a>
              <Link
                to={IS_DEMO_MODE ? "/demo" : "/login"}
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#134E4A]"
              >
                {IS_DEMO_MODE ? "Try live demo" : "Sign in"}
                <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main id="top">
        {/* Hero Section */}
        <section id="platform" className="border-b border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-8 lg:py-20">
            <div className="animate-fade-up lg:col-span-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
                Dental education, reimagined
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#0F172A] sm:text-5xl">
                Precision in every practice.
              </h1>
              <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
                A unified digital workspace for dental education, practical assignments, interactive
                tooth-image annotation and academic evaluation.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to={IS_DEMO_MODE ? "/demo" : "/login"}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#134E4A]"
                >
                  {IS_DEMO_MODE ? "Try live demo" : "Access workspace"}
                  <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-6 py-3 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-slate-50"
                >
                  Explore features
                </a>
              </div>

              <p className="mt-5 text-xs text-slate-500">
                Unified login for Administrators, Professors, and Students. Educational prototype
                environment.
              </p>
            </div>

            <div className="mt-10 animate-fade-up-delay lg:col-span-7 lg:mt-0">
              <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-slate-50 shadow-lg">
                <div className="flex items-center gap-2 border-b border-[#E2E8F0] bg-white px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="ml-2 text-xs font-medium text-slate-500">
                    eDent • Professor Workspace
                  </span>
                </div>
                <img
                  src="/showcase/prof-dashboard.png"
                  alt="eDent Professor Dashboard preview with synthetic demonstration data"
                  className="block w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Role-Specific Product Overview */}
        <section id="features" className="reveal-section mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
              Role-scoped architecture
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A]">
              Designed for every academic role
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Each user signs into a focused workspace tailored to their responsibilities in the
              dental practical-work lifecycle.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {[
              {
                role: "Administrator",
                icon: faShieldHalved,
                summary: "Faculty governance and account access control.",
                items: [
                  "Faculty account directory and search",
                  "Account activation and deactivation",
                  "Status filtering and safe deletion",
                ],
              },
              {
                role: "Professor",
                icon: faUserTie,
                summary: "End-to-end cohort, assignment, and evaluation management.",
                items: [
                  "Academic groups and student management",
                  "Tooth catalog and practical-work assignments",
                  "Submissions Center and image inspection",
                  "Cohort statistics and A4 PDF reporting",
                ],
              },
              {
                role: "Student",
                icon: faGraduationCap,
                summary: "Guided practical-work submission and progress tracking.",
                items: [
                  "Assigned practical-work overview",
                  "Interactive front & side landmark annotation",
                  "Prototype angle & score calculation",
                  "Submission tracking and profile management",
                ],
              },
            ].map((card) => (
              <article
                key={card.role}
                className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-[#0F766E]">
                    <FontAwesomeIcon icon={card.icon} className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-[#0F172A]">{card.role}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{card.summary}</p>
                  <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="mt-1 h-3.5 w-3.5 shrink-0 text-[#0F766E]"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Flagship Tooth Analysis Studio Showcase */}
        <section className="reveal-section border-y border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-8 lg:py-20">
            <div className="lg:col-span-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-[#0F766E]">
                <FontAwesomeIcon icon={faTooth} className="h-3.5 w-3.5" aria-hidden="true" />
                Flagship Studio
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#0F172A]">
                Tooth Analysis Studio
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Students upload front and side tooth illustrations or photographs, place nine
                guided landmarks per view, and persist annotated visual evidence for professor
                review.
              </p>

              <ol className="mt-6 space-y-3 text-sm text-slate-700">
                {[
                  "Upload front and side tooth images",
                  "Select Cervical, Axial, and Incisal / occlusal landmarks",
                  "Calculate prototype angles and scores",
                  "Composite and submit visual measurement evidence",
                  "Enable authorized professor inspection and PDF export",
                ].map((step, idx) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0F766E] text-xs font-semibold text-white">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-[#134E4A]">
                <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
                <span>
                  Educational prototype only: angle definitions and scoring are designed for
                  academic training and are not clinically validated or intended for diagnosis.
                </span>
              </div>
            </div>

            <div className="mt-10 lg:col-span-7 lg:mt-0">
              <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-slate-50 shadow-md">
                <img
                  src="/showcase/tooth-studio.png"
                  alt="eDent Tooth Analysis Studio with front and side landmark overlays"
                  className="block w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="reveal-section mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
              Academic workflow
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A]">
              From assignment to evaluation report
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                icon: faUserTie,
                title: "1. Assign",
                desc: "Professor creates and assigns practical work to a cohort.",
              },
              {
                icon: faTooth,
                title: "2. Annotate",
                desc: "Student uploads front & side images and places landmarks.",
              },
              {
                icon: faCheckCircle,
                title: "3. Persist",
                desc: "Annotated images, angles, and scores are saved.",
              },
              {
                icon: faClipboardCheck,
                title: "4. Review",
                desc: "Professor inspects submissions in the Submissions Center.",
              },
              {
                icon: faFilePdf,
                title: "5. Export",
                desc: "Formatted A4 PDF reports are exported for records.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]">
                  <FontAwesomeIcon icon={item.icon} className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[#0F172A]">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Product Showcase */}
        <section className="reveal-section border-t border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
                  Live product views
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A]">
                  Inside the eDent workspaces
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {SHOWCASE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveShowcase(tab.key)}
                    className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                      activeShowcase === tab.key
                        ? "border-[#0F766E] bg-[#0F766E] text-white"
                        : "border-[#E2E8F0] bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-slate-50 shadow-md">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-white px-5 py-3">
                <span className="text-xs font-semibold text-[#0F172A]">
                  {currentShowcase.label}
                </span>
                <span className="hidden text-xs text-slate-500 sm:inline">
                  {currentShowcase.caption}
                </span>
              </div>
              <img
                src={currentShowcase.image}
                alt={currentShowcase.alt}
                className="block w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="reveal-section mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-[#134E4A] px-8 py-12 text-white shadow-sm sm:flex-row sm:items-center sm:px-12">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Ready to enter your academic workspace?
              </h2>
              <p className="mt-2 text-sm text-teal-100/90">
                Sign in with your administrator, professor, or student credentials, or register a new
                faculty account.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={IS_DEMO_MODE ? "/demo" : "/login"}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#134E4A] transition-colors hover:bg-teal-50"
              >
                {IS_DEMO_MODE ? "Try live demo" : "Sign in"}
                <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              {!IS_DEMO_MODE && (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Professor sign up
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="space-y-2">
            <BrandLogo variant="sidebar" tone="light" subtitle="Dental Education Platform" />
            <p className="max-w-md text-xs text-slate-500">
              Educational prototype platform for dental practical-work training. Not clinically
              validated and not intended for diagnosis or treatment.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-xs text-slate-500 lg:items-end">
            <div className="flex flex-wrap gap-5 font-medium text-slate-600">
              <a href="#platform" className="hover:text-[#0F766E]">
                Platform
              </a>
              <a href="#features" className="hover:text-[#0F766E]">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-[#0F766E]">
                How it works
              </a>
              <Link to={IS_DEMO_MODE ? "/demo" : "/login"} className="hover:text-[#0F766E]">
                {IS_DEMO_MODE ? "Try live demo" : "Sign in"}
              </Link>
            </div>
            <p>Developed and maintained by Aymen Alioua.</p>
          </div>
        </div>
      </footer>
      <DemoAnnouncement autoShow />
    </div>
  );
};

export default LandingPage;

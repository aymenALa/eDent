import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompass } from "@fortawesome/free-solid-svg-icons";

const NotFound404 = () => (
  <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4 py-12 text-[#0F172A]">
    <div className="w-full max-w-md rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-[#0F766E]">
        <FontAwesomeIcon icon={faCompass} className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#0F766E]">Error 404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#0F172A]">
        Oops, page not found
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Sorry, we couldn&apos;t find the page you requested.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#0F766E] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#134E4A]"
      >
        Go to home
      </Link>
    </div>
  </main>
);

export default NotFound404;

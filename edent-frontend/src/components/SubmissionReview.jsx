import { useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "./ui/StatusBadge";
import Modal from "./ui/Modal";

const formatScore = (val) => Number((Number(val) || 0).toFixed(2));

const SubmissionReview = ({ student, pw, submission }) => {
  const [enlarged, setEnlarged] = useState(null);

  if (!submission) return null;

  const frontNote = formatScore(submission.noteFront);
  const sideNote = formatScore(submission.noteSide);
  const totalScore = formatScore(frontNote + sideNote);

  const panels = [
    {
      key: "front",
      title: "Front image",
      image: submission.imageFront,
      note: frontNote,
      rows: [
        { name: "Cervical", measured: submission.af1, supplementary: submission.af2 },
        { name: "Axial", measured: submission.bf1, supplementary: submission.bf2 },
        { name: "Incisal / occlusal", measured: submission.cf1, supplementary: submission.cf2 },
      ],
    },
    {
      key: "side",
      title: "Side image",
      image: submission.imageSide,
      note: sideNote,
      rows: [
        { name: "Cervical", measured: submission.as1, supplementary: submission.as2 },
        { name: "Axial", measured: submission.bs1, supplementary: submission.bs2 },
        { name: "Incisal / occlusal", measured: submission.cs1, supplementary: submission.cs2 },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Identity & Metadata Summary */}
      <div className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-slate-50 p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
        {student && (
          <div>
            <span className="block font-medium text-slate-500">Student</span>
            <span className="mt-0.5 block font-semibold text-[#0F172A]">
              {student.firstName} {student.lastName}
            </span>
          </div>
        )}
        {student?.group?.code && (
          <div>
            <span className="block font-medium text-slate-500">Academic group</span>
            <span className="mt-0.5 block font-semibold text-[#0F172A]">{student.group.code}</span>
          </div>
        )}
        <div>
          <span className="block font-medium text-slate-500">Practical work</span>
          <span className="mt-0.5 block font-semibold text-[#0F172A]">{pw?.title || "—"}</span>
        </div>
        <div>
          <span className="block font-medium text-slate-500">Tooth &amp; date</span>
          <span className="mt-0.5 block font-semibold text-[#0F172A]">
            {pw?.tooth?.name || "—"}
            {submission.date ? ` • ${submission.date}` : ""}
          </span>
        </div>
      </div>

      {/* Combined Prototype Score */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
            Combined prototype score
          </p>
          <p className="text-xs text-slate-600">
            Front ({frontNote}/10) + Side ({sideNote}/10) • Educational prototype evaluation only
          </p>
        </div>
        <span className="rounded-lg bg-white px-4 py-1.5 text-lg font-bold text-[#0F766E] shadow-sm">
          {totalScore}/20
        </span>
      </div>

      {/* Front & Side Evidence Panels */}
      <div className="grid gap-5 md:grid-cols-2">
        {panels.map((panel) => (
          <section
            key={panel.key}
            className="flex flex-col rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 className="font-semibold text-[#0F172A]">{panel.title}</h4>
              <div className="flex items-center gap-2">
                <StatusBadge tone="teal">Score: {panel.note}/10</StatusBadge>
                {panel.image && (
                  <button
                    type="button"
                    onClick={() => setEnlarged({ title: panel.title, image: panel.image })}
                    aria-label={`Enlarge ${panel.title}`}
                    className="rounded-lg border border-[#E2E8F0] p-1.5 text-slate-500 hover:bg-slate-50 hover:text-[#0F766E]"
                  >
                    <FontAwesomeIcon icon={faExpand} className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-lg border border-[#E2E8F0] bg-slate-50 p-2">
              {panel.image ? (
                <img
                  src={`data:image/png;base64,${panel.image}`}
                  alt={`Submitted ${panel.title.toLowerCase()}`}
                  className="max-h-72 w-auto max-w-full cursor-zoom-in object-contain"
                  onClick={() => setEnlarged({ title: panel.title, image: panel.image })}
                />
              ) : (
                <span className="text-xs text-slate-400">No image available</span>
              )}
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-[#E2E8F0]">
              <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left font-semibold">
                      Region
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      Measured
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      Supplementary (180° − θ)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {panel.rows.map((row) => (
                    <tr key={row.name}>
                      <td className="px-3 py-2 font-medium text-[#0F172A]">{row.name}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[#0F766E]">
                        {row.measured}°
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {row.supplementary}°
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      <p className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
        <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <span>
          Landmark overlays are composited into submitted images at submission time. Earlier
          submissions that stored only raw images display the stored image without fabricated
          overlays. Prototype scoring is educational only and not for clinical diagnosis.
        </span>
      </p>

      {/* Enlarged Image Lightbox */}
      <Modal
        open={Boolean(enlarged)}
        onClose={() => setEnlarged(null)}
        title={enlarged?.title || "Image preview"}
        size="xl"
      >
        {enlarged && (
          <div className="flex justify-center rounded-lg bg-slate-50 p-2">
            <img
              src={`data:image/png;base64,${enlarged.image}`}
              alt={enlarged.title}
              className="max-h-[75vh] w-auto max-w-full object-contain"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

SubmissionReview.propTypes = {
  student: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    group: PropTypes.shape({ code: PropTypes.string }),
  }),
  pw: PropTypes.shape({
    title: PropTypes.string,
    tooth: PropTypes.shape({ name: PropTypes.string }),
  }),
  submission: PropTypes.shape({
    date: PropTypes.string,
    time: PropTypes.string,
    imageFront: PropTypes.string,
    imageSide: PropTypes.string,
    noteFront: PropTypes.number,
    noteSide: PropTypes.number,
    af1: PropTypes.number,
    af2: PropTypes.number,
    bf1: PropTypes.number,
    bf2: PropTypes.number,
    cf1: PropTypes.number,
    cf2: PropTypes.number,
    as1: PropTypes.number,
    as2: PropTypes.number,
    bs1: PropTypes.number,
    bs2: PropTypes.number,
    cs1: PropTypes.number,
    cs2: PropTypes.number,
  }),
};

export default SubmissionReview;

import { useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faRotateLeft, faUpload } from "@fortawesome/free-solid-svg-icons";
import Button from "../ui/Button";
import StatusBadge from "../ui/StatusBadge";
import { LANDMARK_COLORS, LANDMARK_NAMES } from "../../utils/annotationCanvas";
import { IS_DEMO_MODE } from "../../utils/api";

const STEP_LABELS = ["Endpoint 1", "Vertex", "Endpoint 2"];

const calculateAngle = (a, vertex, b) => {
  const first = { x: a.x - vertex.x, y: a.y - vertex.y };
  const second = { x: b.x - vertex.x, y: b.y - vertex.y };
  const denominator = Math.hypot(first.x, first.y) * Math.hypot(second.x, second.y);
  if (!denominator) return 0;
  const cosine = (first.x * second.x + first.y * second.y) / denominator;
  return (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
};

const computeThreeAngles = (pts) =>
  [0, 1, 2].map((index) => {
    const triple = pts.slice(index * 3, index * 3 + 3);
    return triple.length === 3
      ? Number(calculateAngle(triple[0], triple[1], triple[2]).toFixed(2))
      : null;
  });

const AngleImageAnnotator = ({ label, value, onChange }) => {
  const imageRef = useRef(null);
  const [points, setPoints] = useState(value.points || []);

  const angles = useMemo(
    () =>
      [0, 1, 2].map((index) => {
        const triple = points.slice(index * 3, index * 3 + 3);
        return triple.length === 3 ? calculateAngle(triple[0], triple[1], triple[2]) : null;
      }),
    [points]
  );

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPoints([]);
      onChange({ image: reader.result, angles: [], points: [] });
    };
    reader.readAsDataURL(file);
  };

  const chooseSampleImage = async () => {
    const sampleUrl =
      label.toLowerCase() === "front"
        ? "/demo-samples/tooth-front-sample.png"
        : "/demo-samples/tooth-side-sample.png";
    const response = await fetch(sampleUrl);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onload = () => {
      setPoints([]);
      onChange({ image: reader.result, angles: [], points: [] });
    };
    reader.readAsDataURL(blob);
  };

  const addPoint = (event) => {
    if (points.length >= 9 || !imageRef.current) return;
    const bounds = imageRef.current.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const next = [
      ...points,
      {
        x: ((event.clientX - bounds.left) / bounds.width) * 100,
        y: ((event.clientY - bounds.top) / bounds.height) * 100,
      },
    ];
    setPoints(next);

    const calculated = computeThreeAngles(next).filter((angle) => angle !== null);
    onChange({ image: value.image, angles: calculated, points: next });
  };

  const undo = () => {
    const next = points.slice(0, -1);
    setPoints(next);
    const calculated = computeThreeAngles(next).filter((angle) => angle !== null);
    onChange({ image: value.image, angles: calculated, points: next });
  };

  const currentGroup = Math.min(2, Math.floor(points.length / 3));
  const currentStep = points.length % 3;
  const isComplete = points.length === 9;

  return (
    <section className="flex flex-col rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[#0F172A]">{label} view</h3>
            <StatusBadge tone={isComplete ? "success" : "neutral"}>
              {points.length}/9 landmarks
            </StatusBadge>
          </div>
          <p className="mt-0.5 text-xs text-slate-600">
            {!value.image
              ? "Upload a tooth image to begin landmark placement."
              : isComplete
              ? "All 9 landmarks placed. Use Undo point to adjust."
              : `Next point: ${LANDMARK_NAMES[currentGroup]} — ${STEP_LABELS[currentStep]}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {IS_DEMO_MODE && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={chooseSampleImage}
              data-testid={`use-sample-${label.toLowerCase()}`}
            >
              Use sample image
            </Button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#0F766E] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#134E4A]">
            <FontAwesomeIcon icon={faUpload} className="h-3.5 w-3.5" aria-hidden="true" />
            {value.image ? "Replace image" : "Choose image"}
            <input className="hidden" type="file" accept="image/*" onChange={chooseImage} />
          </label>
        </div>
      </div>

      {value.image ? (
        <>
          <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-[#E2E8F0] bg-slate-100 p-3">
            <div className="relative inline-block max-w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
              <img
                ref={imageRef}
                src={value.image}
                onClick={addPoint}
                className="block h-auto max-h-[420px] w-auto max-w-full cursor-crosshair select-none"
                alt={`${label} tooth`}
              />
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {[0, 1, 2].map((group) => {
                  const triple = points.slice(group * 3, group * 3 + 3);
                  const path = triple.map((point) => `${point.x},${point.y}`).join(" ");
                  return (
                    <polyline
                      key={group}
                      points={path}
                      fill="none"
                      stroke={LANDMARK_COLORS[group]}
                      strokeWidth="0.75"
                    />
                  );
                })}
                {points.map((point, index) => (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r="1.35"
                    fill={LANDMARK_COLORS[Math.floor(index / 3)]}
                    stroke="white"
                    strokeWidth="0.35"
                  />
                ))}
              </svg>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            {LANDMARK_NAMES.map((name, index) => (
              <div
                key={name}
                className="rounded-lg border border-[#E2E8F0] bg-slate-50 p-2.5"
              >
                <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: LANDMARK_COLORS[index] }}>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: LANDMARK_COLORS[index] }}
                    aria-hidden="true"
                  />
                  {name}
                </span>
                <div className="mt-1 font-semibold text-[#0F172A]">
                  {angles[index] === null ? "3 points required" : `${angles[index].toFixed(1)}°`}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">{points.length}/9 landmarks selected</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={undo}
              disabled={!points.length}
            >
              <FontAwesomeIcon icon={faRotateLeft} className="h-3 w-3" aria-hidden="true" />
              Undo point
            </Button>
          </div>
        </>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E2E8F0] bg-slate-50/80 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
            <FontAwesomeIcon icon={faImage} className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            Select a {label.toLowerCase()} tooth image
          </p>
          <p className="mt-0.5 text-xs text-slate-500">PNG or JPG supported</p>
        </div>
      )}
    </section>
  );
};

AngleImageAnnotator.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.shape({
    image: PropTypes.string,
    angles: PropTypes.arrayOf(PropTypes.number),
    points: PropTypes.arrayOf(
      PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
      })
    ),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default AngleImageAnnotator;

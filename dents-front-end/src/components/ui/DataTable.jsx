import PropTypes from "prop-types";

const DataTable = ({ columns, rows, rowKey, emptyState }) => {
  if (!rows.length && emptyState) return emptyState;

  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E2E8F0]">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] bg-white">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="transition-colors hover:bg-slate-50/70">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap px-5 py-3.5 text-sm text-[#0F172A] ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      align: PropTypes.oneOf(["left", "right"]),
      render: PropTypes.func.isRequired,
    })
  ).isRequired,
  rows: PropTypes.array.isRequired,
  rowKey: PropTypes.func.isRequired,
  emptyState: PropTypes.node,
};

export default DataTable;

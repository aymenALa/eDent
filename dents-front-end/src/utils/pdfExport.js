const formatScore = (val) => Number((Number(val) || 0).toFixed(2));

const drawPdfBrandMark = (doc, x, y) => {
  // Rounded teal-accent badge with geometric tooth + landmark angle lines
  doc.setFillColor(19, 78, 74);
  doc.roundedRect(x, y, 10, 10, 2, 2, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.roundedRect(x + 2.2, y + 2, 5.6, 4.2, 1.2, 1.2, "S");
  doc.line(x + 3.2, y + 6.2, x + 4.1, y + 8.3);
  doc.line(x + 6.8, y + 6.2, x + 5.9, y + 8.3);
  doc.setDrawColor(20, 184, 166);
  doc.line(x + 3.2, y + 4.8, x + 5, y + 3.4);
  doc.line(x + 5, y + 3.4, x + 6.8, y + 4.8);
};

const drawPageFooter = (doc, pageNum, totalPages, disclaimer) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(disclaimer, 14, pageHeight - 10);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: "right" });
};

export const exportStudentDirectoryPdf = async ({ students, professor, groupLabel }) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const usableWidth = pageWidth - margin * 2;
  const generatedOn = new Date().toISOString().slice(0, 10);

  const profName =
    `${professor?.firstName || ""} ${professor?.lastName || ""}`.trim() ||
    professor?.email ||
    "Professor";

  const drawHeader = () => {
    doc.setFillColor(15, 118, 110);
    doc.rect(0, 0, pageWidth, 24, "F");
    drawPdfBrandMark(doc, margin, 7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("eDent — Student Directory Report", margin + 13, 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `Professor: ${profName}   |   Scope: ${groupLabel}   |   Date: ${generatedOn}   |   Total: ${students.length}`,
      margin + 13,
      18
    );
  };

  const drawTableHeader = (y) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, usableWidth, 8, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("#", margin + 2, y + 5.5);
    doc.text("Student Name", margin + 12, y + 5.5);
    doc.text("Email", margin + 62, y + 5.5);
    doc.text("Phone", margin + 122, y + 5.5);
    doc.text("Group", margin + 154, y + 5.5);
    return y + 8;
  };

  drawHeader();
  let y = drawTableHeader(30);

  students.forEach((student, idx) => {
    if (y > 272) {
      doc.addPage();
      drawHeader();
      y = drawTableHeader(30);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, usableWidth, 7.5, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);

    const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim().slice(0, 26);
    const email = String(student.email || "").slice(0, 32);
    const phone = String(student.number || "—").slice(0, 16);
    const group = String(student.group?.code || "—").slice(0, 16);

    doc.text(String(idx + 1), margin + 2, y + 5.2);
    doc.text(fullName, margin + 12, y + 5.2);
    doc.setTextColor(71, 85, 105);
    doc.text(email, margin + 62, y + 5.2);
    doc.text(phone, margin + 122, y + 5.2);
    doc.text(group, margin + 154, y + 5.2);
    y += 7.5;
  });

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    drawPageFooter(doc, p, totalPages, "eDent Dental Education Platform • Synthetic / Academic Directory");
  }

  doc.save("liste_etudiants.pdf");
};

const loadImageDims = (base64) =>
  new Promise((resolve) => {
    if (!base64) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 400, h: img.naturalHeight || 300 });
    img.onerror = () => resolve({ w: 400, h: 300 });
    img.src = `data:image/png;base64,${base64}`;
  });

export const exportSubmissionPdf = async ({ student, pw, submission }) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const usableWidth = pageWidth - margin * 2;

  const frontNote = formatScore(submission.noteFront);
  const sideNote = formatScore(submission.noteSide);
  const totalScore = formatScore(frontNote + sideNote);
  const studentName = `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || "Student";

  // Header
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, pageWidth, 24, "F");
  drawPdfBrandMark(doc, margin, 7);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("eDent — Practical Work Submission Report", margin + 13, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Practical Work: ${pw?.title || "—"}   |   Date: ${submission.date || "—"} ${submission.time || ""}`,
    margin + 13,
    18
  );

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, 30, usableWidth, 24, 2, 2, "FD");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text(`Student: ${studentName}`, margin + 4, 37);
  doc.text(`Group: ${student?.group?.code || "—"}`, margin + 96, 37);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Email: ${student?.email || "—"}`, margin + 4, 43);
  doc.text(`Tooth: ${pw?.tooth?.name || "—"}`, margin + 96, 43);
  doc.setTextColor(15, 118, 110);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Combined Prototype Score: ${totalScore}/20  (Front: ${frontNote}/10, Side: ${sideNote}/10)`,
    margin + 4,
    50
  );

  // Images side-by-side preserving aspect ratios
  const [fDims, sDims] = await Promise.all([
    loadImageDims(submission.imageFront),
    loadImageDims(submission.imageSide),
  ]);

  const boxWidth = (usableWidth - 8) / 2;
  const maxBoxHeight = 76;
  let y = 60;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Front View (${frontNote}/10)`, margin, y);
  doc.text(`Side View (${sideNote}/10)`, margin + boxWidth + 8, y);
  y += 3;

  const drawFittedImage = (b64, dims, xPos, yPos) => {
    doc.setDrawColor(226, 232, 240);
    doc.rect(xPos, yPos, boxWidth, maxBoxHeight);
    if (!b64 || !dims) return;
    const ratio = Math.min((boxWidth - 4) / dims.w, (maxBoxHeight - 4) / dims.h);
    const drawW = dims.w * ratio;
    const drawH = dims.h * ratio;
    const offsetX = xPos + (boxWidth - drawW) / 2;
    const offsetY = yPos + (maxBoxHeight - drawH) / 2;
    doc.addImage(`data:image/png;base64,${b64}`, "PNG", offsetX, offsetY, drawW, drawH);
  };

  drawFittedImage(submission.imageFront, fDims, margin, y);
  drawFittedImage(submission.imageSide, sDims, margin + boxWidth + 8, y);
  y += maxBoxHeight + 10;

  // Angle Measurement Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Angle Measurements & Supplementary Values", margin, y);
  y += 4;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, usableWidth, 8, "F");
  doc.setFontSize(8.5);
  doc.text("View", margin + 3, y + 5.5);
  doc.text("Region", margin + 28, y + 5.5);
  doc.text("Measured Angle", margin + 92, y + 5.5);
  doc.text("Supplementary (180° - θ)", margin + 135, y + 5.5);
  y += 8;

  const rows = [
    ["Front", "Cervical", `${submission.af1}°`, `${submission.af2}°`],
    ["Front", "Axial", `${submission.bf1}°`, `${submission.bf2}°`],
    ["Front", "Incisal / occlusal", `${submission.cf1}°`, `${submission.cf2}°`],
    ["Side", "Cervical", `${submission.as1}°`, `${submission.as2}°`],
    ["Side", "Axial", `${submission.bs1}°`, `${submission.bs2}°`],
    ["Side", "Incisal / occlusal", `${submission.cs1}°`, `${submission.cs2}°`],
  ];

  rows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, usableWidth, 7.5, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(row[0], margin + 3, y + 5.2);
    doc.text(row[1], margin + 28, y + 5.2);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 118, 110);
    doc.text(row[2], margin + 92, y + 5.2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(row[3], margin + 135, y + 5.2);
    y += 7.5;
  });

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    drawPageFooter(
      doc,
      p,
      totalPages,
      "Educational prototype evaluation only — not for clinical diagnosis."
    );
  }

  doc.save(`${student?.lastName || "Student"}${pw?.title || "Submission"}.pdf`);
};

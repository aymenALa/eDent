export const LANDMARK_COLORS = ["#2563EB", "#0F766E", "#D97706"];
export const LANDMARK_NAMES = ["Cervical", "Axial", "Incisal / occlusal"];

/**
 * Composites placed percentage-space landmarks and measurement lines onto an offscreen canvas
 * matching the image's natural dimensions, returning a PNG data URL.
 */
export const compositeAnnotatedImage = (dataUrl, points = []) =>
  new Promise((resolve) => {
    if (!dataUrl || !points.length) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) {
        resolve(dataUrl);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const scale = Math.max(1, Math.min(width, height) / 400);
      const lineWidth = 2.4 * scale;
      const radius = 4.5 * scale;

      for (let group = 0; group < 3; group += 1) {
        const triple = points.slice(group * 3, group * 3 + 3);
        if (triple.length >= 2) {
          ctx.beginPath();
          ctx.strokeStyle = LANDMARK_COLORS[group];
          ctx.lineWidth = lineWidth;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          triple.forEach((pt, idx) => {
            const px = (pt.x / 100) * width;
            const py = (pt.y / 100) * height;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
        }
      }

      points.forEach((pt, idx) => {
        const px = (pt.x / 100) * width;
        const py = (pt.y / 100) * height;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = LANDMARK_COLORS[Math.floor(idx / 3)];
        ctx.fill();
        ctx.lineWidth = 1.6 * scale;
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();
      });

      try {
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

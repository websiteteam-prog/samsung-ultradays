import { useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

/*
 * IMEI barcode reader (modal).
 *   - Take photo : opens the camera, user clicks a photo, it's scanned
 *   - Upload     : pick an existing photo from the gallery
 * On a valid read it returns the 15-digit IMEI via onDetected(imei).
 *
 * Requires:  npm install html5-qrcode
 */

const FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.QR_CODE,
];

function extractImei(decodedText) {
  const digits = (decodedText || "").replace(/\D/g, "");
  if (digits.length === 15) return digits;
  if (digits.length === 16) return digits.slice(0, 15); // IMEISV -> first 15
  const m = digits.match(/\d{15}/);
  return m ? m[0] : "";
}

export default function ImeiScanner({ onDetected, onClose }) {
  const [error, setError] = useState("");
  const [info, setInfo] = useState("Take a photo of the IMEI barcode, or upload one from your gallery.");
  const [busy, setBusy] = useState(false);

  const cameraRef = useRef(null);  // opens camera (capture)
  const galleryRef = useRef(null); // opens gallery
  const workRef = useRef(null);

  async function readFile(file, clearRef) {
    if (!file) return;
    setError(""); setBusy(true); setInfo("Reading the barcode…");

    const reader = new Html5Qrcode(workRef.current.id, { formatsToSupport: FORMATS, verbose: false });
    try {
      const decoded = await reader.scanFile(file, false);
      const imei = extractImei(decoded);
      if (imei) {
        onDetected(imei);
      } else {
        setError("Couldn't find a 15-digit IMEI in that image. Try a clearer photo of the IMEI barcode.");
        setInfo("");
      }
    } catch {
      setError("Couldn't read a barcode from that image. Use a clear, close photo of the IMEI barcode.");
      setInfo("");
    } finally {
      try { await reader.clear(); } catch { /* ignore */ }
      setBusy(false);
      if (clearRef?.current) clearRef.current.value = "";
    }
  }

  return (
    <div className="scan-overlay" onClick={onClose}>
      <div className="scan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="scan-head">
          <strong>Scan IMEI barcode</strong>
          <button className="scan-x" onClick={onClose}>✕</button>
        </div>

        {/* hidden worker element required by the library */}
        <div id="imei-reader-work" ref={workRef} style={{ display: "none" }} />

        {error
          ? <div className="alert err" style={{ marginTop: 4 }}>{error}</div>
          : <p className="note" style={{ marginTop: 4 }}>{info}</p>}

        {/* Camera capture (opens camera directly on phones) */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
          onChange={(e) => readFile(e.target.files?.[0], cameraRef)} />
        {/* Gallery picker */}
        <input ref={galleryRef} type="file" accept="image/*" hidden
          onChange={(e) => readFile(e.target.files?.[0], galleryRef)} />

        <button className="btn gold" disabled={busy} onClick={() => cameraRef.current?.click()} style={{ marginTop: 16 }}>
          {busy ? "Reading…" : "📷 Take photo"}
        </button>
        <button className="btn ghost" disabled={busy} onClick={() => galleryRef.current?.click()} style={{ marginTop: 10 }}>
          🖼 Upload from gallery
        </button>
        <button className="btn ghost" onClick={onClose} style={{ marginTop: 10 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
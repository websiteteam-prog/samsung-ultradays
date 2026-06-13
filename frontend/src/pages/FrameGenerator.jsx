import { useRef, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

// The branded frame PNG (lives in frontend/public/frame.png)
const FRAME_SRC = "/frame.png";

// White-screen rectangle inside the frame, as fractions of the frame size.
// Measured from the Samsung "Ultra Days" artwork.
const SCREEN = { left: 0.2978, top: 0.2832, width: 0.3133, height: 0.4310 };

// Photo adjustment defaults: zoom multiplier, brightness %, warmth %.
const DEFAULTS = { zoom: 1, brightness: 100, warmth: 0 };

export default function FrameGenerator() {
  const nav = useNavigate();
  const canvasRef = useRef(null);
  const frameImgRef = useRef(null);
  const photoImgRef = useRef(null);
  const galleryRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [frameReady, setFrameReady] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [dataUrl, setDataUrl] = useState("");
  const [adj, setAdj] = useState(DEFAULTS);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // Registered name (saved at Step 1) — drawn on the frame below the phone
  const customerName = (sessionStorage.getItem("customerName") || "").trim();

  // Load the frame image once
  useEffect(() => {
    const fimg = new Image();
    fimg.onload = () => { frameImgRef.current = fimg; setFrameReady(true); };
    fimg.src = FRAME_SRC;
  }, []);

  // Composite: photo (with filters) inside the screen, then frame on top.
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const frame = frameImgRef.current;
    if (!canvas || !frame) return;

    const W = frame.naturalWidth;
    const H = frame.naturalHeight;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    const sx = SCREEN.left * W;
    const sy = SCREEN.top * H;
    const sw = SCREEN.width * W;
    const sh = SCREEN.height * H;

    // 1) Draw the user's photo first, clipped to the screen rectangle
    const p = photoImgRef.current;
    if (p) {
      const base = Math.max(sw / p.width, sh / p.height);
      const scale = base * adj.zoom;
      const dw = p.width * scale;
      const dh = p.height * scale;
      const dx = sx + (sw - dw) / 2;
      const dy = sy + (sh - dh) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(sx, sy, sw, sh);
      ctx.clip();
      ctx.filter = `brightness(${adj.brightness}%) sepia(${adj.warmth}%)`;
      ctx.drawImage(p, dx, dy, dw, dh);
      ctx.filter = "none";
      ctx.restore();
    }

    // 2) Draw the frame ON TOP (its screen is transparent, so the photo shows through)
    ctx.drawImage(frame, 0, 0, W, H);

    // 3) Draw the registered name near the bottom of the phone (on a pill)
    if (customerName) {
      const cx = sx + sw / 2;
      const cy = sy + sh - sh * 0.06;
      const fontSize = Math.round(sw * 0.11);
      ctx.font = `700 ${fontSize}px Segoe UI, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const textW = ctx.measureText(customerName).width;
      const padX = fontSize * 0.7;
      const pillW = textW + padX * 2;
      const pillH = fontSize * 1.7;
      const pillX = cx - pillW / 2;
      const pillY = cy - pillH / 2;
      const r = pillH / 2;

      ctx.fillStyle = "rgba(20, 18, 50, 0.62)";
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, r);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.fillText(customerName, cx, cy + 1);
    }

    setDataUrl(canvas.toDataURL("image/png"));
  }, [adj, customerName]);

  useEffect(() => { if (frameReady) render(); }, [frameReady, hasPhoto, adj, render]);

  function loadPhoto(src) {
    const img = new Image();
    img.onload = () => {
      photoImgRef.current = img;
      setAdj(DEFAULTS);
      setHasPhoto(true);
      setTimeout(render, 0);
    };
    img.src = src;
  }

  function handleFile(file) {
    if (!file) return;
    loadPhoto(URL.createObjectURL(file));
  }

  // ---- Live camera ----
  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 0);
    } catch (err) {
      if (err.name === "NotAllowedError") setCameraError("Camera permission was denied. Please allow camera access and try again.");
      else if (err.name === "NotFoundError") setCameraError("No camera was found on this device.");
      else setCameraError("Could not start the camera. You can upload from gallery instead.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const vw = video.videoWidth, vh = video.videoHeight;
    const tmp = document.createElement("canvas");
    tmp.width = vw; tmp.height = vh;
    tmp.getContext("2d").drawImage(video, 0, 0, vw, vh);
    const captured = tmp.toDataURL("image/png");
    stopCamera();
    loadPhoto(captured);
  }

  useEffect(() => () => stopCamera(), []);

  const setA = (k) => (e) => setAdj((f) => ({ ...f, [k]: Number(e.target.value) }));
  const reset = () => setAdj(DEFAULTS);

  function download() {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "galaxy-ultra-days.png";
    a.click();
  }

  async function share() {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "galaxy-ultra-days.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Galaxy Ultra Days", text: "#GalaxyUltraDays" });
      } else {
        download();
        alert("Sharing isn't supported on this device — the image was downloaded instead.");
      }
    } catch { /* cancelled */ }
  }

  useEffect(() => { if (dataUrl && hasPhoto) sessionStorage.setItem("framedImage", dataUrl); }, [dataUrl, hasPhoto]);

  return (
    <div className="wrap">
      <Link className="back" to="/">← Home</Link>
      <span className="eyebrow">Step 2 of 3</span>
      <h1>Create your branded frame</h1>
      <p className="lead">Add your photo — it appears inside the phone screen. Then download or share.</p>

      <div className="card">
        {!cameraOn && (
          <div className="btn-row">
            <button className="btn ghost" onClick={() => galleryRef.current.click()}>🖼 Gallery</button>
            <button className="btn ghost" onClick={startCamera}>📷 Camera</button>
          </div>
        )}
        <input ref={galleryRef} type="file" accept="image/*" hidden
          onChange={(e) => handleFile(e.target.files[0])} />

        {cameraError && <div className="alert err">{cameraError}</div>}

        {cameraOn && (
          <div className="camera">
            <div className="camera-view">
              <video ref={videoRef} playsInline muted />
            </div>
            <div className="btn-row">
              <button className="btn ghost" onClick={stopCamera}>Cancel</button>
              <button className="btn gold" onClick={capturePhoto}>📸 Capture</button>
            </div>
          </div>
        )}

        <div className="preview" style={{ display: cameraOn ? "none" : "block" }}>
          <canvas ref={canvasRef} />
        </div>

        {!hasPhoto && !cameraOn && (
          <p className="note">Pick a photo and it will appear inside the phone screen.</p>
        )}

        {hasPhoto && !cameraOn && (
          <>
            <div className="filters">
              <div className="filter-head">
                <h3>Edit your photo</h3>
                <button className="reset" onClick={reset}>Reset</button>
              </div>
              <label className="slider">Zoom <span>{adj.zoom.toFixed(2)}×</span>
                <input type="range" min="1" max="3" step="0.01" value={adj.zoom} onChange={setA("zoom")} />
              </label>
              <label className="slider">Brightness <span>{adj.brightness}%</span>
                <input type="range" min="50" max="150" value={adj.brightness} onChange={setA("brightness")} />
              </label>
              <label className="slider">Warmth <span>{adj.warmth}%</span>
                <input type="range" min="0" max="80" value={adj.warmth} onChange={setA("warmth")} />
              </label>
            </div>

            <div className="btn-row">
              <button className="btn ghost" onClick={() => galleryRef.current.click()}>↺ Change photo</button>
              <button className="btn ghost" onClick={startCamera}>📷 Retake</button>
            </div>

            <div className="btn-row">
              <button className="btn gold" onClick={download}>⬇ Download</button>
              <button className="btn" onClick={share}>↗ Share</button>
            </div>
            <button className="btn ghost" onClick={() => nav("/submit")} style={{ marginTop: 12 }}>
              Posted it? Next: submit proof →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
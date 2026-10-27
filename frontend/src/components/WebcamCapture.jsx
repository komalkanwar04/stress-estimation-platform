import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const WebcamCapture = forwardRef(function WebcamCapture({ isLive = false, isCapturing = false }, ref) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [streamActive, setStreamActive] = useState(false);

  useEffect(() => {
    let stream;
    let isMounted = true;

    async function initCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        });
        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (err) {
        if (isMounted) {
          setError("Webcam access required. Please allow camera permissions in your browser.");
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    captureBase64() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return null;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      // Draw image
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.85);
    },
  }));

  return (
    <div className="webcam-hud-wrapper">
      {error ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "#f43f5e" }}>
          <p style={{ fontSize: "1.2rem", marginBottom: 8 }}>📷 ⚠️</p>
          <p style={{ fontSize: "0.85rem" }}>{error}</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="webcam-video-element"
          />

          {/* Futuristic HUD Scanning Elements */}
          <div className="hud-overlay">
            <div className="hud-top-bar">
              <div className="hud-pill">
                <span className={`hud-status-dot ${isLive ? "live" : ""}`} />
                {isLive ? "LIVE STREAM ACTIVE" : streamActive ? "AI TRACKER READY" : "CONNECTING..."}
              </div>
              <div className="hud-pill" style={{ opacity: 0.8 }}>
                30 FPS • 720p
              </div>
            </div>

            <div className="hud-targeting-box">
              <div className="hud-corner tl" />
              <div className="hud-corner tr" />
              <div className="hud-corner bl" />
              <div className="hud-corner br" />
              {isLive && <div className="hud-scan-line" />}
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-mono)" }}>
                Align face inside frame • Natural light recommended
              </span>
            </div>
          </div>
        </>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
});

export default WebcamCapture;

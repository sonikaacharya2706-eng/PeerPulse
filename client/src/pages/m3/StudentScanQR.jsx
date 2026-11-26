import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Camera,
  Keyboard,
  RefreshCw,
  VideoOff,
  Sparkles,
} from 'lucide-react';

const StudentScanQR = () => {
  const [scannedResult, setScannedResult] = useState(null);
  const [errorBanner, setErrorBanner] = useState(null);
  const [marking, setMarking] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const lastScannedTokenRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  // Play a pleasant scan confirmation beep
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      // Audio autoplay restrictions
    }
  };

  // Automatically start camera on mount when mode === 'camera'
  useEffect(() => {
    if (mode !== 'camera') {
      stopScanner();
      return;
    }

    let isMounted = true;
    const scannerElementId = 'qr-reader';

    const initAndStartScanner = async () => {
      setCameraError(null);
      setCameraActive(false);

      try {
        // Create Html5Qrcode instance
        const html5QrCode = new Html5Qrcode(scannerElementId);
        scannerRef.current = html5QrCode;

        const scanConfig = {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        };

        const onScanSuccess = (decodedText) => {
          handleQRDetected(decodedText);
        };

        const onScanFailure = () => {
          // continuous frame scan, no need to log
        };

        // Attempt 1: Back camera on mobile (environment)
        try {
          await html5QrCode.start({ facingMode: 'environment' }, scanConfig, onScanSuccess, onScanFailure);
          if (isMounted) {
            setCameraActive(true);
            isScanningRef.current = true;
          }
          return;
        } catch (envErr) {
          console.warn('Environment camera not available, falling back to front camera:', envErr);
        }

        // Attempt 2: Front/User camera (laptops, webcams)
        try {
          await html5QrCode.start({ facingMode: 'user' }, scanConfig, onScanSuccess, onScanFailure);
          if (isMounted) {
            setCameraActive(true);
            isScanningRef.current = true;
          }
          return;
        } catch (userErr) {
          console.warn('User camera not available, querying device list:', userErr);
        }

        // Attempt 3: Query available video devices
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          await html5QrCode.start(devices[0].id, scanConfig, onScanSuccess, onScanFailure);
          if (isMounted) {
            setCameraActive(true);
            isScanningRef.current = true;
          }
        } else {
          throw new Error('No video camera devices found on this device');
        }
      } catch (err) {
        console.error('Camera activation error:', err);
        if (isMounted) {
          setCameraActive(false);
          const msg =
            err.name === 'NotAllowedError'
              ? 'Camera permission denied. Please grant camera access in browser permissions or use Manual Code below.'
              : err.message || 'Could not start camera. Please verify camera permissions.';
          setCameraError(msg);
        }
      }
    };

    // Small delay to ensure DOM element is ready
    const timer = setTimeout(() => {
      initAndStartScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [mode]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error clearing scanner:', e);
      }
      scannerRef.current = null;
      isScanningRef.current = false;
      setCameraActive(false);
    }
  };

  const handleQRDetected = (decodedString) => {
    // Avoid double submitting same code during rapid frame scan
    if (marking || lastScannedTokenRef.current === decodedString) return;

    try {
      let sid = null;
      let token = null;

      if (decodedString.startsWith('{')) {
        const data = JSON.parse(decodedString);
        sid = data.sid;
        token = data.token;
      } else if (decodedString.includes(':')) {
        const parts = decodedString.split(':');
        sid = parts[0].trim();
        token = parts[1].trim();
      }

      if (sid && token) {
        lastScannedTokenRef.current = decodedString;
        playBeep();
        submitAttendance(sid, token);

        // Reset duplicate throttle after 5 seconds
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = setTimeout(() => {
          lastScannedTokenRef.current = null;
        }, 5000);
      } else {
        toast.error('Unrecognized QR payload format');
      }
    } catch (err) {
      toast.error('Failed to parse scanned QR code');
    }
  };

  const submitAttendance = async (sid, token) => {
    setMarking(true);
    setErrorBanner(null);

    // Get or initialize persistent hardware/browser deviceId
    let deviceId = localStorage.getItem('smartcampus_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('smartcampus_device_id', deviceId);
    }

    // Acquire geolocation if supported
    let lat = null;
    let lng = null;
    let accuracy = null;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        accuracy = pos.coords.accuracy;
      } catch (geoErr) {
        // Continue even if GPS permission is denied or timed out
      }
    }

    try {
      const res = await api.post('/attendance/mark', {
        sid,
        token,
        lat,
        lng,
        accuracy,
        deviceId,
      });

      setScannedResult(res.data);
      toast.success('Attendance marked successfully!');
    } catch (err) {
      setErrorBanner(err.message || 'Attendance rejected');
      toast.error(err.message || 'Attendance rejected');
    } finally {
      setMarking(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    try {
      if (manualCode.startsWith('{')) {
        const parsed = JSON.parse(manualCode);
        submitAttendance(parsed.sid, parsed.token);
      } else if (manualCode.includes(':')) {
        const [sid, token] = manualCode.split(':');
        submitAttendance(sid.trim(), token.trim());
      } else {
        toast.error('Manual code format invalid. Expected {sid, token} or sid:token');
      }
    } catch (err) {
      toast.error('Invalid manual code format');
    }
  };

  const handleScanAgain = () => {
    setScannedResult(null);
    setErrorBanner(null);
    lastScannedTokenRef.current = null;
  };

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
          <ScanLine className="h-6 w-6 text-brand-600 animate-pulse" /> Auto-Scan Classroom QR
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Camera automatically turns on. Aim at the live classroom display to mark attendance.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 p-1 bg-white dark:bg-slate-800">
        <button
          type="button"
          onClick={() => {
            setMode('camera');
            setErrorBanner(null);
            setScannedResult(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition ${
            mode === 'camera'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Camera className="h-4 w-4" /> Live Camera Scanner
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('manual');
            setErrorBanner(null);
            setScannedResult(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition ${
            mode === 'manual'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Keyboard className="h-4 w-4" /> Manual Code
        </button>
      </div>

      {/* Camera Status Indicator */}
      {mode === 'camera' && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                cameraActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
              }`}
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {cameraActive ? 'Camera Active & Scanning' : 'Activating Camera...'}
            </span>
          </div>
          {marking && (
            <span className="text-brand-600 dark:text-brand-400 font-semibold animate-pulse">
              Submitting Attendance...
            </span>
          )}
        </div>
      )}

      {/* Rejection / Conflict Banner */}
      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Attendance Rejected</p>
              <p className="mt-0.5">{errorBanner}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleScanAgain}
            className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 text-rose-800 dark:text-rose-200 rounded text-[11px] font-semibold shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Success Banner */}
      {scannedResult && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Attendance Recorded: Present</p>
              <p className="mt-0.5">
                Verified for <strong>{scannedResult.student?.name}</strong> (
                {scannedResult.student?.rollNo || 'Roll N/A'}) at{' '}
                {new Date(scannedResult.markedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleScanAgain}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold shrink-0"
          >
            Scan Again
          </button>
        </div>
      )}

      {/* Scanner Box */}
      <Card>
        {mode === 'camera' ? (
          <div>
            {cameraError ? (
              <div className="p-6 text-center space-y-3">
                <VideoOff className="h-10 w-10 text-rose-500 mx-auto" />
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {cameraError}
                </p>
                <div className="flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMode('manual');
                    }}
                  >
                    Switch to Manual Entry
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCameraError(null);
                      setMode('camera');
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry Camera
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* HTML5 QR Code Mount Node */}
                <div
                  id="qr-reader"
                  className="w-full overflow-hidden rounded-xl bg-black min-h-[280px]"
                />

                {/* Laser scan animation overlay */}
                {cameraActive && !scannedResult && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative w-64 h-64 border-2 border-brand-500/80 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      {/* Corner Accents */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />

                      {/* Moving Laser Line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-bounce" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-[11px] text-slate-400 text-center mt-3">
              Hold device steady. Scanning occurs automatically when the live dynamic QR is centered.
            </p>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Enter QR Token Payload
              </label>
              <textarea
                rows="3"
                required
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder='Paste payload e.g. {"sid":"...","token":"..."}'
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <Button type="submit" loading={marking} className="w-full py-2.5">
              Submit Attendance Code
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default StudentScanQR;

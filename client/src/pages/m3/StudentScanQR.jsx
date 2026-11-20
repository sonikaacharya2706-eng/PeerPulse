import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ScanLine, CheckCircle2, AlertCircle, Camera, Keyboard } from 'lucide-react';

const StudentScanQR = () => {
  const [scannedResult, setScannedResult] = useState(null);
  const [errorBanner, setErrorBanner] = useState(null);
  const [marking, setMarking] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'

  const scannerRef = useRef(null);

  useEffect(() => {
    if (mode !== 'camera') return;

    const html5QrcodeScanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        handleQRDetected(decodedText);
      },
      (error) => {
        // silent continuous scan frame errors
      }
    );

    scannerRef.current = html5QrcodeScanner;

    return () => {
      try {
        html5QrcodeScanner.clear();
      } catch (e) {}
    };
  }, [mode]);

  const handleQRDetected = (decodedString) => {
    try {
      const data = JSON.parse(decodedString);
      if (data.sid && data.token) {
        submitAttendance(data.sid, data.token);
      } else {
        toast.error('Unrecognized QR payload');
      }
    } catch (err) {
      toast.error('Failed to parse QR code format');
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
      // Acceptance Test 3: Clear rejection of expired QR or 409 already marked
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
      // Expected format: {"sid":"...","token":"..."} or sid:token
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

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
          <ScanLine className="h-6 w-6 text-brand-600" /> Scan Classroom QR
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Aim your camera at the faculty projector or display to mark your attendance.
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
          <Camera className="h-4 w-4" /> Camera Scanner
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

      {/* Rejection / Conflict Banner (Acceptance Test 3) */}
      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Attendance Rejected</p>
            <p className="mt-0.5">{errorBanner}</p>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {scannedResult && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Attendance Recorded: Present</p>
            <p className="mt-0.5">
              Verified for {scannedResult.student?.name} ({scannedResult.student?.rollNo || 'Roll N/A'}) at{' '}
              {new Date(scannedResult.markedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}

      {/* Scanner Box */}
      <Card>
        {mode === 'camera' ? (
          <div>
            <div id="qr-reader" className="w-full overflow-hidden rounded-lg" />
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Hold device steady. Scans automatically upon detecting dynamic QR.
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

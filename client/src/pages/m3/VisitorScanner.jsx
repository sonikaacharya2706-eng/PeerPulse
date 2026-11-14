import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { CheckCircle2, AlertCircle, Camera, Keyboard, UserCheck, ShieldCheck } from 'lucide-react';

const VisitorScanner = () => {
  const [passCodeInput, setPassCodeInput] = useState('');
  const [scanResponse, setScanResponse] = useState(null);
  const [errorBanner, setErrorBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'

  const scannerRef = useRef(null);

  useEffect(() => {
    if (mode !== 'camera') return;

    const html5QrcodeScanner = new Html5QrcodeScanner(
      'visitor-qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        handleScanSubmit(decodedText);
      },
      (error) => {}
    );

    scannerRef.current = html5QrcodeScanner;

    return () => {
      try {
        html5QrcodeScanner.clear();
      } catch (e) {}
    };
  }, [mode]);

  const handleScanSubmit = async (codeToSubmit = passCodeInput) => {
    if (!codeToSubmit || !codeToSubmit.trim()) return;

    setLoading(true);
    setErrorBanner(null);
    setScanResponse(null);

    try {
      const res = await api.post('/visitors/scan', {
        passCode: codeToSubmit.trim(),
      });

      setScanResponse(res);
      toast.success(res.message);
      setPassCodeInput('');
    } catch (err) {
      // Acceptance Test 5: 3rd scan -> error "Pass already used"
      setErrorBanner(err.message || 'Pass scanning error');
      toast.error(err.message || 'Scan error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
          <ShieldCheck className="h-6 w-6 text-brand-600" /> Security Gate Visitor Scanner
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Scan guest passes to automatically record Check-In, Check-Out, and host alerts.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 p-1 bg-white dark:bg-slate-800">
        <button
          type="button"
          onClick={() => {
            setMode('camera');
            setErrorBanner(null);
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
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition ${
            mode === 'manual'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Keyboard className="h-4 w-4" /> Enter Passcode
        </button>
      </div>

      {/* Acceptance Test 5 Result Banners */}
      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Pass Rejected</p>
            <p className="mt-0.5">{errorBanner}</p>
          </div>
        </div>
      )}

      {scanResponse && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
            scanResponse.action === 'checked_in'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
              : 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 text-teal-800 dark:text-teal-200'
          }`}
        >
          <CheckCircle2
            className={`h-5 w-5 shrink-0 mt-0.5 ${
              scanResponse.action === 'checked_in' ? 'text-emerald-600' : 'text-teal-600'
            }`}
          />
          <div className="space-y-1">
            <p className="font-bold text-sm">
              {scanResponse.action === 'checked_in' ? 'Check-In Confirmed' : 'Check-Out Confirmed'}
            </p>
            <p>{scanResponse.message}</p>
            <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
              <p>
                <strong>Visitor:</strong> {scanResponse.data?.name} ({scanResponse.data?.phone})
              </p>
              <p>
                <strong>Host:</strong> {scanResponse.data?.personToMeet?.name}
              </p>
              <p>
                <strong>Pass Code:</strong> {scanResponse.data?.passCode}
              </p>
              {scanResponse.data?.checkInAt && (
                <p>
                  <strong>Check-in Time:</strong>{' '}
                  {new Date(scanResponse.data.checkInAt).toLocaleTimeString()}
                </p>
              )}
              {scanResponse.data?.checkOutAt && (
                <p>
                  <strong>Check-out Time:</strong>{' '}
                  {new Date(scanResponse.data.checkOutAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Card>
        {mode === 'camera' ? (
          <div>
            <div id="visitor-qr-reader" className="w-full overflow-hidden rounded-lg" />
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Aim camera at visitor pass QR code. Automatic scanning on detection.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleScanSubmit(passCodeInput);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Enter 10-Character Pass Code
              </label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="e.g. 7X9B2K4L1M"
                value={passCodeInput}
                onChange={(e) => setPassCodeInput(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono text-center tracking-widest text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full py-2.5">
              Process Pass Code
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default VisitorScanner;

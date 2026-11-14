import QRCode from 'qrcode';

export const generateQRCodeDataURL = async (text, options = {}) => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      ...options,
    });
  } catch (err) {
    console.error('QR Code DataURL generation error:', err);
    throw err;
  }
};

export const generateQRCodeBuffer = async (text, options = {}) => {
  try {
    return await QRCode.toBuffer(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      ...options,
    });
  } catch (err) {
    console.error('QR Code Buffer generation error:', err);
    throw err;
  }
};

/**
 * Detect client device, OS, browser, and form factor from User-Agent and Request
 * @param {import('express').Request} req
 */
export function detectDeviceFromRequest(req) {
  const ua = req.headers['user-agent'] || '';

  // Detect Operating System
  let os = 'Unknown OS';
  let iconType = 'laptop';

  if (/Windows/.test(ua)) {
    os = 'Windows';
  } else if (/Android/.test(ua)) {
    os = 'Android';
    iconType = 'smartphone';
  } else if (/iPhone|iPod/.test(ua)) {
    os = 'iOS';
    iconType = 'smartphone';
  } else if (/iPad/.test(ua)) {
    os = 'iPadOS';
    iconType = 'smartphone';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    os = 'macOS';
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
  }

  // Detect Browser
  let browser = 'Web Browser';
  if (/Edg\//.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox\//.test(ua)) {
    browser = 'Firefox';
  } else if (/OPR\//.test(ua) || /Opera\//.test(ua)) {
    browser = 'Opera';
  }

  // Detect IP
  const rawIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    '127.0.0.1';
  let ip = rawIp.replace(/^::ffff:/, '');
  if (ip === '::1' || ip === '::') {
    ip = '127.0.0.1';
  }

  // Detect Location
  const isLocal =
    ip === '127.0.0.1' ||
    ip === 'localhost' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.');
  const location = isLocal ? 'Local Network' : 'Current Device';

  return {
    device: `${os} • ${browser}`,
    os,
    browser,
    ip,
    location,
    iconType,
    userAgent: ua,
  };
}

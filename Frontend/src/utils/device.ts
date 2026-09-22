/**
 * Device & Browser Detection Utilities
 */

export interface DeviceInfo {
  device: string;
  os: string;
  browser: string;
  iconType: 'laptop' | 'smartphone';
}

/**
 * Detect current OS, browser, and device form factor from navigator.userAgent
 */
export function detectCurrentDevice(userAgent?: string): DeviceInfo {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  // Detect Operating System
  let os = 'Unknown OS';
  let iconType: 'laptop' | 'smartphone' = 'laptop';

  if (/Windows/.test(ua)) {
    os = 'Windows';
  } else if (/Android/.test(ua)) {
    os = 'Android';
    iconType = 'smartphone';
  } else if (/iPhone|iPad|iPod/.test(ua)) {
    os = /iPad/.test(ua) ? 'iPadOS' : 'iOS';
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

  return {
    device: `${os} • ${browser}`,
    os,
    browser,
    iconType,
  };
}

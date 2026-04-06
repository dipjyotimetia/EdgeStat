type DeviceType = 'desktop' | 'mobile' | 'tablet';

interface UAResult {
  browser: string;
  device_type: DeviceType;
}

const BROWSER_PATTERNS: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Brave/, 'Brave'],
  [/Vivaldi/, 'Vivaldi'],
  [/Chrome\//, 'Chrome'],
  [/Firefox\//, 'Firefox'],
  [/Safari\//, 'Safari'],
  [/MSIE|Trident/, 'IE'],
];

export function parseUserAgent(ua: string): UAResult {
  let browser = 'Unknown';
  for (const [pattern, name] of BROWSER_PATTERNS) {
    if (pattern.test(ua)) {
      browser = name;
      break;
    }
  }

  let device_type: DeviceType = 'desktop';
  if (/Mobile|Android.*Mobile|iPhone|iPod/.test(ua)) {
    device_type = 'mobile';
  } else if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) {
    device_type = 'tablet';
  }

  return { browser, device_type };
}

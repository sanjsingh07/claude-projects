export const SIGN_ICONS: Record<string, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

export function getSignEmoji(sign: string): string {
  if (!sign) return '';
  const normalized = sign.toLowerCase().trim();
  return SIGN_ICONS[normalized] || '';
}

export function formatSignName(sign: string): string {
  if (!sign) return '';
  const normalized = sign.toLowerCase().trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

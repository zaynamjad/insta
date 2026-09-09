export interface LocaleMeta {
  code: string;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  /** ISO 3166-1 country code for the flag image shown in the language switcher — must stay a real country code (flagcdn.com lookup key), independent of what text label is displayed. */
  countryCode: string;
  /** Text shown next to the flag; falls back to countryCode when omitted. */
  displayCode?: string;
  flag: string;
}

export const LOCALES: LocaleMeta[] = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr", countryCode: "US", displayCode: "EN", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", countryCode: "ES", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr", countryCode: "FR", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", countryCode: "DE", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr", countryCode: "PT", flag: "🇵🇹" },
  { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr", countryCode: "IT", flag: "🇮🇹" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", dir: "ltr", countryCode: "NL", flag: "🇳🇱" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr", countryCode: "RU", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr", countryCode: "TR", flag: "🇹🇷" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", countryCode: "SA", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr", countryCode: "IN", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", dir: "ltr", countryCode: "BD", flag: "🇧🇩" },
  { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl", countryCode: "PK", flag: "🇵🇰" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", dir: "ltr", countryCode: "ID", flag: "🇮🇩" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", dir: "ltr", countryCode: "VN", flag: "🇻🇳" },
  { code: "th", name: "Thai", nativeName: "ไทย", dir: "ltr", countryCode: "TH", flag: "🇹🇭" },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr", countryCode: "JP", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", dir: "ltr", countryCode: "KR", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", nativeName: "中文", dir: "ltr", countryCode: "CN", flag: "🇨🇳" },
  { code: "pl", name: "Polish", nativeName: "Polski", dir: "ltr", countryCode: "PL", flag: "🇵🇱" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", dir: "ltr", countryCode: "SE", flag: "🇸🇪" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", dir: "ltr", countryCode: "UA", flag: "🇺🇦" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", dir: "ltr", countryCode: "GR", flag: "🇬🇷" },
  { code: "cs", name: "Czech", nativeName: "Čeština", dir: "ltr", countryCode: "CZ", flag: "🇨🇿" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina", dir: "ltr", countryCode: "SK", flag: "🇸🇰" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", dir: "ltr", countryCode: "HU", flag: "🇭🇺" },
  { code: "ro", name: "Romanian", nativeName: "Română", dir: "ltr", countryCode: "RO", flag: "🇷🇴" },
  { code: "bg", name: "Bulgarian", nativeName: "Български", dir: "ltr", countryCode: "BG", flag: "🇧🇬" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski", dir: "ltr", countryCode: "HR", flag: "🇭🇷" },
  { code: "sr", name: "Serbian", nativeName: "Српски", dir: "ltr", countryCode: "RS", flag: "🇷🇸" },
  { code: "sl", name: "Slovenian", nativeName: "Slovenščina", dir: "ltr", countryCode: "SI", flag: "🇸🇮" },
  { code: "fa", name: "Persian", nativeName: "فارسی", dir: "rtl", countryCode: "IR", flag: "🇮🇷" },
  { code: "ps", name: "Pashto", nativeName: "پښتو", dir: "rtl", countryCode: "AF", flag: "🇦🇫" },
  { code: "ku", name: "Kurdish", nativeName: "Kurdî", dir: "ltr", countryCode: "IQ", flag: "🇮🇶" },
  { code: "ckb", name: "Sorani Kurdish", nativeName: "کوردی", dir: "rtl", countryCode: "IQ", displayCode: "CKB", flag: "🇮🇶" },
  { code: "he", name: "Hebrew", nativeName: "עברית", dir: "rtl", countryCode: "IL", flag: "🇮🇱" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan dili", dir: "ltr", countryCode: "AZ", flag: "🇦🇿" },
  { code: "hy", name: "Armenian", nativeName: "Հայերեն", dir: "ltr", countryCode: "AM", flag: "🇦🇲" },
  { code: "ka", name: "Georgian", nativeName: "ქართული", dir: "ltr", countryCode: "GE", flag: "🇬🇪" },
  { code: "kk", name: "Kazakh", nativeName: "Қазақ тілі", dir: "ltr", countryCode: "KZ", flag: "🇰🇿" },
  { code: "ky", name: "Kyrgyz", nativeName: "Кыргызча", dir: "ltr", countryCode: "KG", flag: "🇰🇬" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", dir: "ltr", countryCode: "NP", flag: "🇳🇵" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල", dir: "ltr", countryCode: "LK", flag: "🇱🇰" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", dir: "ltr", countryCode: "IN", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", dir: "ltr", countryCode: "IN", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", dir: "ltr", countryCode: "IN", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", dir: "ltr", countryCode: "IN", flag: "🇮🇳" },
];

export const LOCALE_CODES = LOCALES.map((l) => l.code);

export function getLocaleMeta(code: string): LocaleMeta {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

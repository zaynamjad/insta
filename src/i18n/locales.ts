export interface LocaleMeta {
  code: string;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  /** Representative country for the flag shown in the language switcher. */
  countryCode: string;
  flag: string;
}

export const LOCALES: LocaleMeta[] = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr", countryCode: "EN", flag: "🇺🇸" },
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
];

export const LOCALE_CODES = LOCALES.map((l) => l.code);

export function getLocaleMeta(code: string): LocaleMeta {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

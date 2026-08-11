export type Language = "en" | "mm";

const translations = {
  en: {
    // Profile
    profileTitle: "Profile",
    language: "Language",
    logOut: "Log Out",
    // Home
    welcome: "Welcome",
    // Common
    save: "Save",
    cancel: "Cancel",
    error: "Error",
    failedToSignOut: "Failed to sign out.",
  },
  mm: {
    // Profile
    profileTitle: "အကောင့်",
    language: "ဘာသာစကား",
    logOut: "ထွက်မည်",
    // Home
    welcome: "ကြိုဆိုပါတယ်",
    // Common
    save: "သိမ်းဆည်းမည်",
    cancel: "ပယ်ဖျက်မည်",
    error: "အမှား",
    failedToSignOut: "ထွက်ရန် မအောင်မြင်ပါ။",
  },
} as const;

export function t(lang: Language, key: keyof (typeof translations)["en"]): string {
  return translations[lang][key] ?? key;
}

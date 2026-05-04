import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'fa' | 'ps';

type I18nContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  isRtl: boolean;
};

const STORAGE_KEY = 'gp_lang';

const translations: Record<Language, Record<string, string>> = {
  en: {
    'lang.en': 'English',
    'lang.fa': 'Dari',
    'lang.ps': 'Pashto',
    'header.home': 'Home',
    'header.dashboard': 'Dashboard',
    'header.streaming': 'Streaming',
    'header.gameplay': 'Gameplay',
    'header.login': 'Log in',
    'header.logout': 'Log out',
    'home.title': 'Premium Cricket Streaming Landing Page',
    'home.hero.badge': 'Live matches streaming now',
    'home.hero.heading': 'Watch. Play. Win.',
    'home.hero.sub':
      'Experience cricket like never before with dual-screen live streaming, real-time gaming, and rewards.',
    'home.hero.ctaContinue': 'Continue',
    'home.hero.ctaTrial': 'Start Free 5-Min Trial',
    'home.pricing.continue': 'Continue to Login',
    'login.title': 'Sign in — Game Palazio',
    'login.brand.headline': 'Play. Watch. One account.',
    'login.brand.copy':
      'Stream live matches and launch games in the browser — secured with a quick code sent to your phone.',
    'login.step.signin': 'Sign in',
    'login.step.enterPhone': 'Enter your phone',
    'login.step.verify': 'Verify it’s you',
    'login.form.country': 'Country / region',
    'login.form.mobile': 'Mobile number',
    'login.form.continue': 'Continue',
    'login.form.sending': 'Sending code…',
    'login.form.code': '6-digit code',
    'login.form.signin': 'Sign in',
    'login.form.signingIn': 'Signing in…',
    'login.form.resend': 'Resend code',
    'login.form.backHome': 'Back to home',
  },
  fa: {
    'lang.en': 'انگلیسی',
    'lang.fa': 'دری',
    'lang.ps': 'پشتو',
    'header.home': 'خانه',
    'header.dashboard': 'داشبورد',
    'header.streaming': 'پخش زنده',
    'header.gameplay': 'بازی',
    'header.login': 'ورود',
    'header.logout': 'خروج',
    'home.title': 'صفحه پریمیوم پخش کریکت',
    'home.hero.badge': 'مسابقات زنده در حال پخش',
    'home.hero.heading': 'تماشا کن. بازی کن. برنده شو.',
    'home.hero.sub': 'تجربه جدید کریکت با پخش زنده، بازی هم‌زمان و جوایز هیجان‌انگیز.',
    'home.hero.ctaContinue': 'ادامه',
    'home.hero.ctaTrial': 'شروع آزمایشی ۵ دقیقه‌ای',
    'home.pricing.continue': 'ادامه به صفحه ورود',
    'login.title': 'ورود — گیم پالازیو',
    'login.brand.headline': 'بازی کن. تماشا کن. یک حساب.',
    'login.brand.copy':
      'مسابقات زنده را تماشا کنید و بازی را در مرورگر اجرا کنید — با کد یک‌بار مصرف امن.',
    'login.step.signin': 'ورود',
    'login.step.enterPhone': 'شماره موبایل خود را وارد کنید',
    'login.step.verify': 'تایید هویت',
    'login.form.country': 'کشور / منطقه',
    'login.form.mobile': 'شماره موبایل',
    'login.form.continue': 'ادامه',
    'login.form.sending': 'در حال ارسال کد…',
    'login.form.code': 'کد ۶ رقمی',
    'login.form.signin': 'ورود',
    'login.form.signingIn': 'در حال ورود…',
    'login.form.resend': 'ارسال دوباره کد',
    'login.form.backHome': 'بازگشت به خانه',
  },
  ps: {
    'lang.en': 'انګلیسي',
    'lang.fa': 'دري',
    'lang.ps': 'پښتو',
    'header.home': 'کور',
    'header.dashboard': 'ډشبورډ',
    'header.streaming': 'ژوندی خپرونه',
    'header.gameplay': 'لوبه',
    'header.login': 'ننوتل',
    'header.logout': 'وتل',
    'home.title': 'د کرکټ پریمیم لایو سټریم پاڼه',
    'home.hero.badge': 'ژوندۍ لوبې همدا اوس خپرېږي',
    'home.hero.heading': 'وګوره. ولوبه. وګټه.',
    'home.hero.sub': 'د کرکټ نوې تجربه د ژوندۍ خپرونې، هم‌مهاله لوبې او انعامونو سره.',
    'home.hero.ctaContinue': 'ادامه',
    'home.hero.ctaTrial': '۵ دقیقې وړیا ازموینه پیل کړئ',
    'home.pricing.continue': 'د ننوتلو پاڼې ته دوام',
    'login.title': 'ننوتل — ګیم پالازیو',
    'login.brand.headline': 'ولوبه. وګوره. یو حساب.',
    'login.brand.copy': 'ژوندۍ لوبې وګورئ او لوبه په براوزر کې پیل کړئ — د یو ځل کوډ له لارې خوندي ننوتل.',
    'login.step.signin': 'ننوتل',
    'login.step.enterPhone': 'خپل تلیفون نمبر دننه کړئ',
    'login.step.verify': 'تایید',
    'login.form.country': 'هېواد / سیمه',
    'login.form.mobile': 'د موبایل شمېره',
    'login.form.continue': 'ادامه',
    'login.form.sending': 'کوډ لېږل کېږي…',
    'login.form.code': '۶ عددي کوډ',
    'login.form.signin': 'ننوتل',
    'login.form.signingIn': 'ننوتل روان دي…',
    'login.form.resend': 'کوډ بیا ولېږئ',
    'login.form.backHome': 'کور ته بېرته',
  },
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    return saved === 'fa' || saved === 'ps' || saved === 'en' ? saved : 'en';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const isRtl = language === 'fa' || language === 'ps';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language, isRtl]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      isRtl,
      t: (key: string, fallback?: string) => translations[language][key] ?? fallback ?? key,
    }),
    [language, isRtl],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}

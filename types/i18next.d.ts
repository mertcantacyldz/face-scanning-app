import 'react-i18next';
import common from '@/locales/en/common.json';
import auth from '@/locales/en/auth.json';
import tabs from '@/locales/en/tabs.json';
import profile from '@/locales/en/profile.json';
import analysis from '@/locales/en/analysis.json';
import premium from '@/locales/en/premium.json';
import exercises from '@/locales/en/exercises.json';
import errors from '@/locales/en/errors.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      auth: typeof auth;
      tabs: typeof tabs;
      profile: typeof profile;
      analysis: typeof analysis;
      premium: typeof premium;
      exercises: typeof exercises;
      errors: typeof errors;
    };
  }
}

const P = '[GHASH]';

/* eslint-disable no-console */
export const log = {
  info:  (...a: unknown[]) => { if (__DEV__) console.log(P, ...a); },
  warn:  (...a: unknown[]) => { if (__DEV__) console.warn(P, ...a); },
  error: (...a: unknown[]) => { if (__DEV__) console.error(P, ...a); },
};

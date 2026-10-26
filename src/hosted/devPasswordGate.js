// V6.1.3: A development-only, locally opted-in test-account login method.
// Both checks are required. The feature is absent from Vite production UI builds.
export function isDevPasswordLoginEnabled(env = {}) {
  return env.DEV === true && env.VITE_SOULFRAME_DEV_PASSWORD_LOGIN === 'true';
}

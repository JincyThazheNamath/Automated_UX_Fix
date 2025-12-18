/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude Playwright and browser packages from server-side bundling
      config.externals = config.externals || [];
      config.externals.push('playwright-core');
      config.externals.push('playwright');
      config.externals.push('@playwright/browser-chromium');
    }
    return config;
  },
};

module.exports = nextConfig;



import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  serverExternalPackages: ["@prisma/client"],
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
  webpack: (config: any) => {
    config.externals = [...(config.externals || []), "@prisma/client"];
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

// Configuração do Sentry
const sentryWebpackPluginOptions = {
  // Forneça um token de upload do Sentry (obrigatório)
  // Você pode criar um em https://sentry.io/settings/account/api/auth-tokens/
  authToken: process.env.SENTRY_AUTH_TOKEN,

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Configurações opcionais
  silent: true, // Suprime logs de build do Sentry
  hideSourceMaps: true, // Oculta source maps em produção
};

// Apenas aplicar Sentry em produção
const config =
  process.env.NODE_ENV === "production"
    ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
    : nextConfig;

export default config;

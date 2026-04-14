export const appConfig = {
  appName: "Aissisted",
  version: "0.1.0",
  environment: process.env.NODE_ENV ?? "development",
  isDev: (process.env.NODE_ENV ?? "development") === "development",
  api: {
    url: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  },
} as const;

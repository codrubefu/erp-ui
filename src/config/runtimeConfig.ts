import { organizationConfigService } from '../services/OrganizationConfigService';

export type RuntimeConfig = {
  apiBaseUrl: string;
  devProxyTarget?: string;
};

const defaultConfig: RuntimeConfig = {
  apiBaseUrl: '/api',
};

let runtimeConfig: RuntimeConfig = defaultConfig;

function normalizeConfig(payload: unknown): RuntimeConfig {
  if (!payload || typeof payload !== 'object') return defaultConfig;
  const config = payload as Partial<RuntimeConfig>;
  const apiBaseUrl = import.meta.env.DEV
    ? defaultConfig.apiBaseUrl
    : typeof config.apiBaseUrl === 'string' && config.apiBaseUrl.trim()
      ? config.apiBaseUrl.trim()
      : defaultConfig.apiBaseUrl;

  return {
    apiBaseUrl,
    devProxyTarget: typeof config.devProxyTarget === 'string' && config.devProxyTarget.trim() ? config.devProxyTarget.trim() : undefined,
  };
}

async function loadOrganizationApiBaseUrl() {
  if (import.meta.env.DEV) return undefined;
  try {
    return await organizationConfigService.getApiBaseUrlForCurrentUrl();
  } catch {
    return undefined;
  }
}

export async function loadRuntimeConfig() {
  try {
    const response = await fetch('/app-config.json', { cache: 'no-store' });
    if (response.ok) runtimeConfig = normalizeConfig(await response.json());
  } catch {
    runtimeConfig = defaultConfig;
  }

  const organizationApiBaseUrl = await loadOrganizationApiBaseUrl();
  if (organizationApiBaseUrl) runtimeConfig = { ...runtimeConfig, apiBaseUrl: organizationApiBaseUrl };

  return runtimeConfig;
}

export function getRuntimeConfig() {
  return runtimeConfig;
}

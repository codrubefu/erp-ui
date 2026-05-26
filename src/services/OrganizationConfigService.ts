export type OrganizationConfigEntry = {
  url: string;
  organization_id?: string | number;
  organisation_id?: string | number;
};

const CONFIG_URL = '/json/organizations.json';

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, '').toLowerCase();
}

function getConfiguredOrganizationId(entry: OrganizationConfigEntry) {
  return entry.organization_id ?? entry.organisation_id;
}

function matchesCurrentUrl(configuredUrl: string, currentUrl: Location) {
  const normalizedConfiguredUrl = normalizeUrl(configuredUrl);
  const normalizedOrigin = normalizeUrl(currentUrl.origin);
  const normalizedHref = normalizeUrl(currentUrl.href);

  return normalizedConfiguredUrl === normalizedOrigin || normalizedConfiguredUrl === normalizedHref;
}

export class OrganizationConfigService {
  async getOrganizationIdForCurrentUrl() {
    const response = await fetch(CONFIG_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Nu pot incarca configuratia organizatiilor (${response.status}).`);
    }

    const config = await response.json() as OrganizationConfigEntry[];
    const match = config.find((entry) => entry.url && matchesCurrentUrl(entry.url, window.location));
    const organizationId = match ? getConfiguredOrganizationId(match) : undefined;

    if (organizationId === undefined || organizationId === null || organizationId === '') {
      throw new Error(`Nu exista organization_id configurat pentru ${window.location.origin}.`);
    }

    return organizationId;
  }
}

export const organizationConfigService = new OrganizationConfigService();

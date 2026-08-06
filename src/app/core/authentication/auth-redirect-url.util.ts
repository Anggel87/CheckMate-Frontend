import { environment } from '../../../environments/environment';
import { ROUTE_PATHS } from '../constants/route-paths.constants';

const ABSOLUTE_HTTP_URL = /^https?:\/\//i;

export function buildCheckmateUrl(pathOrUrl: string): string {
  if (ABSOLUTE_HTTP_URL.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return new URL(pathOrUrl, checkmateBaseUrl()).toString();
}

export function checkmatePortalUrl(): string {
  return environment.checkmatePortalUrl || buildCheckmateUrl(ROUTE_PATHS.portal);
}

export function checkmatePostLogoutRedirectUrl(): string {
  return environment.checkmatePostLogoutRedirectUrl || buildCheckmateUrl('/');
}

export function buildGovernanceLoginUrl(returnPathOrUrl = ROUTE_PATHS.portal): string {
  const loginUrl = new URL(
    environment.governanceLoginUrl || `${environment.governanceBaseUrl}/governance/auth`,
  );

  loginUrl.searchParams.set('client_id', environment.governanceClientId);
  loginUrl.searchParams.set('returnUrl', buildCheckmateUrl(returnPathOrUrl));

  return loginUrl.toString();
}

export function buildGovernanceLogoutUrl(): string {
  const logoutUrl = new URL(
    environment.governanceLogoutUrl || `${environment.governanceBaseUrl}/governance/logout`,
  );

  logoutUrl.searchParams.set('client_id', environment.governanceClientId);
  logoutUrl.searchParams.set('returnUrl', checkmatePostLogoutRedirectUrl());

  return logoutUrl.toString();
}

function checkmateBaseUrl(): string {
  return environment.checkmateWebUrl || window.location.origin;
}

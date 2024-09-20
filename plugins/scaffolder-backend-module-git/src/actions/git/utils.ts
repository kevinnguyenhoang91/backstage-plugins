import { ScmIntegrationRegistry } from '@backstage/integration';

export function parseHostFromUrl(url: string): string {
  const urlObject = new URL(url);
  return urlObject.host;
}

export function getToken(
  repositoryUrl: string,
  integrations: ScmIntegrationRegistry,
): string | undefined {
  const host = parseHostFromUrl(repositoryUrl);
  const integrationConfig =
    integrations.gitlab.byHost(host) ?? integrations.github.byHost(host);

  return integrationConfig?.config.token;
}

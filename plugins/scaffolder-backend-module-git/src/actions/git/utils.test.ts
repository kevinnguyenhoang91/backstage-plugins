import { ConfigReader } from '@backstage/config';
import { getToken, parseHostFromUrl } from './utils';
import { ScmIntegrations } from '@backstage/integration';

describe('parseHostFromUrl', () => {
  it('should parse host from url', () => {
    const url = 'https://github.com/bbckr/backstage-plugins.git';
    const host = parseHostFromUrl(url);
    expect(host).toEqual('github.com');
  });
});

describe('getToken', () => {
  it('should get token from integrations', () => {
    const repositoryUrl = 'https://github.com/bbckr/backstage-plugins.git';
    const config = new ConfigReader({
      integrations: {
        github: [
          {
            host: 'github.com',
            token: 'mocktoken',
          },
        ],
      },
    });
    const integrations = ScmIntegrations.fromConfig(config);

    const token = getToken(repositoryUrl, integrations);
    expect(token).toEqual('mocktoken');
  });
});

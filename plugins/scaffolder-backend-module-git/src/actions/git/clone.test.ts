import { mockServices } from '@backstage/backend-test-utils';
import { PassThrough } from 'stream';
import { createGitCloneAction } from './clone';
import nodegit from 'nodegit';
import { ScmIntegrations } from '@backstage/integration';
import { ConfigReader } from '@backstage/config';

const mockHead = 'mocksha';
const mockDefaultBranch = 'main';

jest.mock('nodegit', () => {
  const Repository = {
    getHeadCommit: jest.fn().mockResolvedValue({
      sha: () => mockHead,
    }),
    getCurrentBranch: jest.fn().mockResolvedValue({
      shorthand: () => mockDefaultBranch,
    }),
  };
  const Clone = jest.fn().mockResolvedValue(Repository);
  return {
    Clone,
    Cred: {
      userpassPlaintextNew: jest.fn(),
    },
  };
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('createGitCloneAction', () => {
  const mockContext = {
    logger: mockServices.logger.mock() as any,
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
    checkpoint: jest.fn(),
    getInitiatorCredentials: jest.fn(),
  };

  it('should call action', async () => {
    const mockCtx = {
      ...mockContext,
      workspacePath: `.test/${crypto.randomUUID()}`,
      input: {
        repositoryUrl: 'https://github.com/bbckr/backstage-plugins.git',
      },
    };

    const mockConfig = new ConfigReader({
      integrations: {
        github: [
          {
            host: 'github.com',
            token: 'mocktoken',
          },
        ],
      },
    });
    const mockIntegrations = ScmIntegrations.fromConfig(mockConfig);

    const action = createGitCloneAction({ integrations: mockIntegrations });
    await action.handler(mockCtx);

    expect(mockCtx.output).toHaveBeenCalledTimes(2);
    expect(mockCtx.output).toHaveBeenNthCalledWith(1, 'head', mockHead);
    expect(mockCtx.output).toHaveBeenNthCalledWith(
      2,
      'defaultBranch',
      mockDefaultBranch,
    );
    expect(nodegit.Clone).toHaveBeenCalledWith(
      mockCtx.input.repositoryUrl,
      expect.any(String),
      expect.any(Object),
    );
    expect(mockCtx.logger.warn).not.toHaveBeenCalled();
    expect(nodegit.Cred.userpassPlaintextNew).toHaveBeenCalledWith(
      'mocktoken',
      'x-oauth-basic',
    );
  });
});

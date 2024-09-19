import { mockServices } from '@backstage/backend-test-utils';
import { PassThrough } from 'stream';
import { createGitCloneAction } from './clone';
import nodegit from 'nodegit';

afterEach(() => {
  jest.resetAllMocks();
});

jest.mock('nodegit', () => ({
  Clone: jest.fn(),
}));

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

    const action = createGitCloneAction();
    await action.handler(mockCtx);

    expect(nodegit.Clone).toHaveBeenCalledWith(mockCtx.input.repositoryUrl, expect.any(String));
  });
});

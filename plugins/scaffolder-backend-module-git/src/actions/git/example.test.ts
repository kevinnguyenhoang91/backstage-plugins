import { mockServices } from '@backstage/backend-test-utils';
import { PassThrough } from 'stream';
import { createAcmeExampleAction } from './example';

describe('acme:example', () => {
  const mockContext = {
    logger: mockServices.logger.mock() as any,
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
    checkpoint: jest.fn(),
    getInitiatorCredentials: jest.fn(),
    workspacePath: '.',
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should call action', async () => {
    const mockCtx = {
      ...mockContext,
      input: {
        myParameter: 'test',
      },
    };

    const action = createAcmeExampleAction();
    await action.handler(mockCtx);

    expect(mockContext.logger.info).toHaveBeenCalledWith(
      'Running example template with parameters: test',
    );
  });
});

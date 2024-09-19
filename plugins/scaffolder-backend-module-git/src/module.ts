import { createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import * as actions from './actions';

/**
 * A backend module that registers the action into the scaffolder
 */
export const scaffolderModule = createBackendModule({
  moduleId: 'bbckr-scaffolder-backend-module-git',
  pluginId: 'scaffolder',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
      },
      async init({ scaffolderActions }) {
        scaffolderActions.addActions(actions.createGitCloneAction());
      },
    });
  },
});

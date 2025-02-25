import assert from 'assert';
import fs from 'fs';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { CommandError } from '../../../../Command.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './app-export.js';
import { accessToken } from '../../../../utils/accessToken.js';

describe(commands.APP_EXPORT, () => {
  let log: string[];
  let logger: Logger;
  let commandInfo: CommandInfo;

  const packageDisplayName = 'Power App';
  const packageDescription = 'Power App Description';
  const packageCreatedBy = 'John Doe';
  const packageSourceEnvironment = "Contoso";
  const path = 'c:/users/John/Documents';
  const environmentName = 'Default-cf409f12-a06f-426e-9955-20f5d7a31dd3';
  const appId = '11403f1a-de85-4b7d-97c9-020429876cb8';
  const listPackageResourcesResponse = {
    status: 'Succeeded',
    baseResourceIds: [
      '/providers/Microsoft.PowerApps/apps/11403f1a-de85-4b7d-97c9-020429876cb8'
    ],
    resources: {
      L1BST1ZJREVSUy9NSUNST1NPRlQuUE9XRVJBUFBTL0FQUFMvMTE0MDNGMUEtREU4NS00QjdELTk3QzktMDIwNDI5ODc2Q0I4: {
        id: `/providers/Microsoft.PowerApps/apps/${appId}`,
        name: appId,
        type: 'Microsoft.PowerApps/apps',
        creationType: 'New, Update',
        details: {
          displayName: 'App'
        },
        configurableBy: 'User',
        hierarchy: 'Root',
        dependsOn: []
      }
    }
  };

  const exportPackageResponse = {
    headers: {
      location: `https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/environments/${environmentName}/packagingOperations/10fc880b-b11d-4fac-b842-386c66b869eb?api-version=2016-11-01`
    },
    data: {
      status: 'Running',
      details: {
        displayName: 'test',
        packageTelemetryId: '84b96b80-4593-4fb4-a35a-3cbe32be98ae'
      },
      resources: {
        '399ede40-1b69-4e28-ac8b-ab6899e617c7': {
          id: '/providers/Microsoft.PowerApps/apps/11403f1a-de85-4b7d-97c9-020429876cb8',
          name: appId,
          type: 'Microsoft.PowerApps/apps',
          status: 'Running',
          suggestedCreationType: 'Update',
          creationType: 'New, Update',
          details: {
            displayName: 'App'
          },
          configurableBy: 'User',
          hierarchy: 'Root',
          dependsOn: []
        }
      }
    }
  };

  const locationRunningResponse = {
    id: `/providers/Microsoft.BusinessAppPlatform/environments/${environmentName}/packagingOperations/10fc880b-b11d-4fac-b842-386c66b869eb`,
    type: 'Microsoft.BusinessAppPlatform/environments/packagingOperations',
    environmentName: environmentName,
    name: '10fc880b-b11d-4fac-b842-386c66b869eb',
    properties: {
      status: 'Running',
      details: {
        displayName: 'test',
        packageTelemetryId: '84b96b80-4593-4fb4-a35a-3cbe32be98ae'
      },
      resources: {
        '399ede40-1b69-4e28-ac8b-ab6899e617c7': {
          id: `/providers/Microsoft.PowerApps/apps/${appId}`,
          name: appId,
          type: 'Microsoft.PowerApps/apps',
          status: 'Running',
          suggestedCreationType: 'Update',
          creationType: 'New, Update',
          details: {
            displayName: 'App'
          },
          configurableBy: 'User',
          hierarchy: 'Root',
          dependsOn: []
        }
      }
    }
  };

  const locationSuccessResponse = {
    id: '/providers/Microsoft.BusinessAppPlatform/environments/Default-0cac6cda-2e04-4a3d-9c16-9c91470d7022/packagingOperations/10fc880b-b11d-4fac-b842-386c66b869eb',
    type: 'Microsoft.BusinessAppPlatform/environments/packagingOperations',
    environmentName: 'Default-0cac6cda-2e04-4a3d-9c16-9c91470d7022',
    name: '10fc880b-b11d-4fac-b842-386c66b869eb',
    properties: {
      status: 'Succeeded',
      packageLink: {
        value: 'https://bapfeblobprodam.blob.core.windows.net/20230303t000000z312d30573c1c498aad959706d35cb25e/Power_App_20230303140531.zip?sv=2018-03-28&sr=c&sig=X9TCSpygBeu7BmzLT7TrN0bni9Qg3VDF9xBp04eUOr0%3D&se=2023-03-03T15%3A05%3A31Z&sp=rl'
      },
      details: {
        displayName: packageDisplayName,
        createdTime: '2023-03-03T17:05:31.7937267Z',
        packageTelemetryId: '84b96b80-4593-4fb4-a35a-3cbe32be98ae'
      },
      resources: {
        '399ede40-1b69-4e28-ac8b-ab6899e617c7': {
          id: `/providers/Microsoft.PowerApps/apps/11403f1a-de85-4b7d-97c9-020429876cb8`,
          name: '11403f1a-de85-4b7d-97c9-020429876cb8',
          type: 'Microsoft.PowerApps/apps',
          status: 'Succeeded',
          suggestedCreationType: 'Update',
          creationType: 'New, Update',
          details: {
            displayName: 'App'
          },
          configurableBy: 'User',
          dependsOn: []
        }
      }
    }
  };

  const fileBlobResponse: any = {
    type: 'Buffer',
    data: [80, 75, 3, 4, 20, 0, 0, 0, 8, 0, 237, 115, 99, 86, 250, 76, 155, 216, 248, 3, 0, 0, 7, 8, 0, 0, 71, 0, 0, 0, 77, 105, 99, 114, 111, 115, 111, 102, 116, 46, 80, 111, 119, 101, 114, 65, 112, 112, 115, 47, 97, 112, 112, 115, 47, 49, 56, 48, 50, 54, 54, 51, 51, 48]
  };

  before(() => {
    (command as any).pollingInterval = 0;
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    sinon.stub(accessToken, 'assertDelegatedAccessToken').resolves();
    auth.connection.active = true;
    commandInfo = cli.getCommandInfo(command);
  });

  beforeEach(() => {
    log = [];
    logger = {
      log: async (msg: string) => {
        log.push(msg);
      },
      logRaw: async (msg: string) => {
        log.push(msg);
      },
      logToStderr: async (msg: string) => {
        log.push(msg);
      }
    };
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get,
      request.post,
      fs.writeFileSync
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.APP_EXPORT);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('exports the specified app correctly', async () => {
    const getStub = sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === exportPackageResponse.headers.location) {
        if (getStub.calledOnce) {
          return locationRunningResponse;
        }
        else {
          return locationSuccessResponse;
        }
      }

      if (opts.url === locationSuccessResponse.properties.packageLink.value) {
        return fileBlobResponse;
      }

      throw 'invalid request';
    });

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === `https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/environments/${environmentName}/listPackageResources?api-version=2016-11-01`) {
        return listPackageResourcesResponse;
      }

      if (opts.url === `https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/environments/${environmentName}/exportPackage?api-version=2016-11-01`) {
        return exportPackageResponse;
      }

      throw 'invalid request';
    });
    const writeFileStub = sinon.stub(fs, 'writeFileSync').returns();

    await command.action(logger, { options: { name: appId, environmentName: environmentName } });
    assert(writeFileStub.calledOnceWithExactly(`./${appId}.zip`, fileBlobResponse, 'binary'));
  });

  it('exports the specified app correctly with packageDisplayName', async () => {
    const getStub = sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === exportPackageResponse.headers.location) {
        if (getStub.calledOnce) {
          return locationRunningResponse;
        }
        else {
          return locationSuccessResponse;
        }
      }

      if (opts.url === locationSuccessResponse.properties.packageLink.value) {
        return fileBlobResponse;
      }

      throw 'invalid request';
    });

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === `https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/environments/${environmentName}/listPackageResources?api-version=2016-11-01`) {
        return listPackageResourcesResponse;
      }

      if (opts.url === `https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/environments/${environmentName}/exportPackage?api-version=2016-11-01`) {
        return exportPackageResponse;
      }

      throw 'invalid request';
    });
    const writeFileStub = sinon.stub(fs, 'writeFileSync').returns();

    await command.action(logger, { options: { name: appId, environmentName: environmentName, packageDisplayName: packageDisplayName } });
    assert(writeFileStub.calledOnceWithExactly(`./${packageDisplayName}.zip`, fileBlobResponse, 'binary'));
  });

  it('exports the specified App correctly with all options', async () => {
    const getStub = sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === exportPackageResponse.headers.location) {
        if (getStub.calledOnce) {
          return locationRunningResponse;
        }
        else {
          return locationSuccessResponse;
        }
      }

      if (opts.url === locationSuccessResponse.properties.packageLink.value) {
        return fileBlobResponse;
      }

      throw 'invalid request';
    });

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === `https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/environments/${environmentName}/listPackageResources?api-version=2016-11-01`) {
        return listPackageResourcesResponse;
      }

      if (opts.url === `https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/environments/${environmentName}/exportPackage?api-version=2016-11-01`) {
        return exportPackageResponse;
      }

      throw 'invalid request';
    });
    const writeFileStub = sinon.stub(fs, 'writeFileSync').returns();

    await command.action(logger, { options: { verbose: true, name: appId, environmentName: environmentName, packageDisplayName: packageDisplayName, packageDescription: packageDescription, packageCreatedBy: packageCreatedBy, packageSourceEnvironment: packageSourceEnvironment, path: path } });
    assert(writeFileStub.calledOnceWithExactly(`${path}/${packageDisplayName}.zip`, fileBlobResponse, 'binary'));
  });

  it('fails validation if the name is not a GUID', async () => {
    const actual = await command.validate({ options: { name: 'foo', environmentName: environmentName, packageDisplayName: packageDisplayName } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if specified path doesn\'t exist', async () => {
    sinon.stub(fs, 'existsSync').returns(false);
    const actual = await command.validate({ options: { name: appId, environmentName: environmentName, packageDisplayName: packageDisplayName, path: '/path/not/found.zip' } }, commandInfo);
    sinonUtil.restore(fs.existsSync);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when the name, environment and packageDisplayName specified', async () => {
    const actual = await command.validate({ options: { name: appId, environmentName: environmentName, packageDisplayName: packageDisplayName } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('correctly handles API OData error', async () => {
    const error = {
      error: {
        message: `Something went wrong exporting the Microsoft Power App`
      }
    };

    sinon.stub(request, 'post').rejects(error);

    await assert.rejects(command.action(logger, { options: { name: appId, environmentName: environmentName, packageDisplayName: packageDisplayName } }),
      new CommandError(error.error.message));
  });
});

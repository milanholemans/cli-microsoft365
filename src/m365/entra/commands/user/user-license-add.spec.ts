import assert from 'assert';
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
import command from './user-license-add.js';

describe(commands.USER_LICENSE_ADD, () => {
  let commandInfo: CommandInfo;
  //#region Mocked Responses
  const validIds = '45715bb8-13f9-4bf6-927f-ef96c102d394,0118A350-71FC-4EC3-8F0C-6A1CB8867561';
  const validUserId = 'eb77fbcf-6fe8-458b-985d-1747284793bc';
  const validUserName = 'John@contos.onmicrosoft.com';
  const userLicenseResponse = {
    "businessPhones": [],
    "displayName": "John Doe",
    "givenName": null,
    "jobTitle": null,
    "mail": "John@contoso.onmicrosoft.com",
    "mobilePhone": null,
    "officeLocation": null,
    "preferredLanguage": null,
    "surname": null,
    "userPrincipalName": "John@contoso.onmicrosoft.com",
    "id": "eb77fbcf-6fe8-458b-985d-1747284793bc"
  };
  //#endregion

  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
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
    loggerLogSpy = sinon.spy(logger, 'log');
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.USER_LICENSE_ADD);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if ids is not a valid guid.', async () => {
    const actual = await command.validate({
      options: {
        ids: 'Invalid GUID', userId: validUserId
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if userId is not a valid guid.', async () => {
    const actual = await command.validate({
      options: {
        ids: validIds, userId: 'Invalid GUID'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if required options specified (ids)', async () => {
    const actual = await command.validate({ options: { ids: validIds, userId: validUserId } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('adds licenses to a user by userId', async () => {
    sinon.stub(request, 'post').callsFake(async opts => {
      if ((opts.url === `https://graph.microsoft.com/v1.0/users/${validUserId}/assignLicense`)) {
        return userLicenseResponse;
      }

      throw `Invalid request ${opts.url}`;
    });

    await command.action(logger, { options: { verbose: true, userId: validUserId, ids: validIds } });
    assert(loggerLogSpy.calledWith(userLicenseResponse));
  });

  it('adds licenses to a user by userName', async () => {
    sinon.stub(request, 'post').callsFake(async opts => {
      if ((opts.url === `https://graph.microsoft.com/v1.0/users/${validUserName}/assignLicense`)) {
        return userLicenseResponse;
      }

      throw `Invalid request ${opts.url}`;
    });

    await command.action(logger, { options: { verbose: true, userName: validUserName, ids: validIds } });
    assert(loggerLogSpy.calledWith(userLicenseResponse));
  });

  it('correctly handles random API error', async () => {
    const error = {
      error: {
        message: 'The license cannot be added.'
      }
    };
    sinon.stub(request, 'post').rejects(error);

    await assert.rejects(command.action(logger, {
      options: {
        userName: validUserName, ids: validIds
      }
    }), new CommandError(error.error.message));
  });
});

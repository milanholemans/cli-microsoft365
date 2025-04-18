import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './channel-member-list.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.CHANNEL_MEMBER_LIST, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

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
    (command as any).items = [];
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get,
      cli.getSettingWithDefaultValue
    ]);
  });

  after(() => {
    sinon.restore();
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.CHANNEL_MEMBER_LIST);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if both teamId and teamName options are not passed', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both teamId and teamName options are passed', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000',
        teamName: 'Team Name'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the teamId is not a valid guid', async () => {
    const actual = await command.validate({
      options: {
        teamId: '00000000-0000',
        channelName: 'Channel Name'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both channelId and channelName options are not passed', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both channelId and channelName options are passed', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:00000000000000000000000000000000@thread.skype',
        channelName: 'Channel Name'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if channelId is not a valid channel ID', async () => {
    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: 'Invalid'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('defines correct properties for the default output', () => {
    assert.deepStrictEqual(command.defaultProperties(), ['id', 'roles', 'displayName', 'userId', 'email']);
  });

  it('fails validation when invalid role specified', async () => {
    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:00000000000000000000000000000000@thread.skype',
        role: 'Invalid'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when valid groupId, channelId and Owner role specified', async () => {
    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:00000000000000000000000000000000@thread.skype',
        role: 'owner'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when valid groupId, channelId and Member role specified', async () => {
    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:00000000000000000000000000000000@thread.skype',
        role: 'member'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when valid groupId, channelId and Guest role specified', async () => {
    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:00000000000000000000000000000000@thread.skype',
        role: 'guest'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('validates for a correct input.', async () => {
    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:00000000000000000000000000000000@thread.skype'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails when group has no team', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/v1.0/groups?$filter=displayName eq '`) > -1) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#groups",
          "value": [
            {
              "@odata.id": "https://graph.microsoft.com/v2/00000000-0000-0000-0000-000000000000/directoryObjects/00000000-0000-0000-0000-000000000000/Microsoft.DirectoryServices.Group",
              "id": "00000000-0000-0000-0000-000000000000",
              "deletedDateTime": null,
              "classification": null,
              "createdDateTime": "2020-10-11T09:35:26Z",
              "creationOptions": [
                "ExchangeProvisioningFlags:3552"
              ],
              "description": "Team Description",
              "displayName": "Team Name",
              "expirationDateTime": null,
              "groupTypes": [
                "Unified"
              ],
              "isAssignableToRole": null,
              "mail": "TeamName@contoso.com",
              "mailEnabled": true,
              "mailNickname": "TeamName",
              "membershipRule": null,
              "membershipRuleProcessingState": null,
              "onPremisesDomainName": null,
              "onPremisesLastSyncDateTime": null,
              "onPremisesNetBiosName": null,
              "onPremisesSamAccountName": null,
              "onPremisesSecurityIdentifier": null,
              "onPremisesSyncEnabled": null,
              "preferredDataLocation": null,
              "preferredLanguage": null,
              "proxyAddresses": [
                "SPO:SPO_97df7113-c3f3-447f-8010-9f88eb0fc7f1@SPO_00000000-0000-0000-0000-000000000000",
                "SMTP:TeamName@contoso.com"
              ],
              "renewedDateTime": "2020-10-11T09:35:26Z",
              "resourceBehaviorOptions": [
                "HideGroupInOutlook",
                "SubscribeMembersToCalendarEventsDisabled",
                "WelcomeEmailDisabled"
              ],
              "resourceProvisioningOptions": [
              ],
              "securityEnabled": false,
              "securityIdentifier": "S-1-12-1-1927732186-1159088485-2915259540-28248825",
              "theme": null,
              "visibility": "Private",
              "onPremisesProvisioningErrors": []
            }
          ]
        };
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        debug: true,
        teamName: 'Team Name'
      }
    } as any), new CommandError('The specified team does not exist in the Microsoft Teams'));
  });

  it('correctly get teams id by team name', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/v1.0/groups?$filter=displayName eq '`) > -1) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#groups",
          "value": [
            {
              "@odata.id": "https://graph.microsoft.com/v2/00000000-0000-0000-0000-000000000000/directoryObjects/00000000-0000-0000-0000-000000000000/Microsoft.DirectoryServices.Group",
              "id": "00000000-0000-0000-0000-000000000000",
              "deletedDateTime": null,
              "classification": null,
              "createdDateTime": "2020-10-11T09:35:26Z",
              "creationOptions": [
                "Team",
                "ExchangeProvisioningFlags:3552"
              ],
              "description": "Team Description",
              "displayName": "Team Name",
              "expirationDateTime": null,
              "groupTypes": [
                "Unified"
              ],
              "isAssignableToRole": null,
              "mail": "TeamName@contoso.com",
              "mailEnabled": true,
              "mailNickname": "TeamName",
              "membershipRule": null,
              "membershipRuleProcessingState": null,
              "onPremisesDomainName": null,
              "onPremisesLastSyncDateTime": null,
              "onPremisesNetBiosName": null,
              "onPremisesSamAccountName": null,
              "onPremisesSecurityIdentifier": null,
              "onPremisesSyncEnabled": null,
              "preferredDataLocation": null,
              "preferredLanguage": null,
              "proxyAddresses": [
                "SPO:SPO_97df7113-c3f3-447f-8010-9f88eb0fc7f1@SPO_00000000-0000-0000-0000-000000000000",
                "SMTP:TeamName@contoso.com"
              ],
              "renewedDateTime": "2020-10-11T09:35:26Z",
              "resourceBehaviorOptions": [
                "HideGroupInOutlook",
                "SubscribeMembersToCalendarEventsDisabled",
                "WelcomeEmailDisabled"
              ],
              "resourceProvisioningOptions": [
                "Team"
              ],
              "securityEnabled": false,
              "securityIdentifier": "S-1-12-1-1927732186-1159088485-2915259540-28248825",
              "theme": null,
              "visibility": "Private",
              "onPremisesProvisioningErrors": []
            }
          ]
        };
      }

      if ((opts.url as string).indexOf('/v1.0/teams/00000000-0000-0000-0000-000000000000/channels/19:00000000000000000000000000000000@thread.skype/members') > -1) {
        return {
          "value": []
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        output: 'json',
        teamName: 'Team name',
        channelId: '19:00000000000000000000000000000000@thread.skype'
      }
    });
    assert(loggerLogSpy.calledWith(
      []
    ));
  });

  it('correctly get channel id by channel name', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/v1.0/teams/00000000-0000-0000-0000-000000000000/channels?$filter=displayName eq '`) > -1) {
        return {
          "value": [
            {
              "id": "19:00000000000000000000000000000000@thread.skype",
              "createdDateTime": "2000-01-01T00:00:00.000Z",
              "displayName": "General",
              "description": "Test Team",
              "isFavoriteByDefault": null,
              "email": "00000000.tenant.onmicrosoft.com@emea.teams.ms",
              "webUrl": "https://teams.microsoft.com/l/channel/19:00000000000000000000000000000000@thread.skype/General?groupId=00000000-0000-0000-0000-000000000000&tenantId=00000000-0000-0000-0000-000000000001",
              "membershipType": "standard"
            }
          ]
        };
      }

      if ((opts.url as string).indexOf('/v1.0/teams/00000000-0000-0000-0000-000000000000/channels/19:00000000000000000000000000000000@thread.skype/members') > -1) {
        return {
          "value": []
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        output: 'json',
        teamId: '00000000-0000-0000-0000-000000000000',
        channelName: 'Channel Name'
      }
    });
    assert(loggerLogSpy.calledWith(
      []
    ));
  });

  it('fails to get channel when channel does not exist', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/v1.0/teams/00000000-0000-0000-0000-000000000000/channels?$filter=displayName eq '`) > -1) {
        return {
          "value": []
        };
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        debug: true,
        teamId: '00000000-0000-0000-0000-000000000000',
        channelName: "Channel name"
      }
    } as any), new CommandError('The specified channel does not exist in the Microsoft Teams team'));
  });

  it('correctly handles error when retrieving all teams', async () => {
    const error = {
      "error": {
        "code": "UnknownError",
        "message": "An error has occurred",
        "innerError": {
          "date": "2022-02-14T13:27:37",
          "request-id": "77e0ed26-8b57-48d6-a502-aca6211d6e7c",
          "client-request-id": "77e0ed26-8b57-48d6-a502-aca6211d6e7c"
        }
      }
    };
    sinon.stub(request, 'get').rejects(error);

    await assert.rejects(command.action(logger, {
      options: {
        teamId: '00000000-0000-0000-0000-000000000000'
      }
    } as any), new CommandError('An error has occurred'));
  });

  it('outputs all data in json output mode', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/teams/00000000-0000-0000-0000-000000000000/channels/19:00000000000000000000000000000000@thread.skype/members`) {
        return {
          value: [
            {
              "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjIzkxZmYyZTE3LTg0ZGUtNDU1YS04ODE1LTUyYjIxNjgzZjY0ZQ==",
              "roles": [],
              "displayName": "User 1",
              "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
              "userId": "00000000-0000-0000-0000-000000000001",
              "email": "user1@domainname.com",
              "tenantId": "00000000-0000-0000-0000-000000000000"
            },
            {
              "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjI2IyMDkxZTE4LTc4ODItNGVmZS1iN2QxLTkwNzAzZjVhNWM2NQ==",
              "roles": [
                "owner"
              ],
              "displayName": "User 2",
              "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
              "userId": "00000000-0000-0000-0000-000000000002",
              "email": "user2@domainname.com",
              "tenantId": "00000000-0000-0000-0000-000000000000"
            },
            {
              "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjIzg0OTg3NjNmLTJjYTItNGRmNy05OTBhLWZkNjg4NTJkOTVmOA==",
              "roles": [
                "guest"
              ],
              "displayName": "User 3",
              "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
              "userId": "00000000-0000-0000-0000-000000000003",
              "email": "user3@externaldomainname.com",
              "tenantId": "00000000-0000-0000-0000-000000000000"
            }
          ]
        };
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        output: 'json',
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:00000000000000000000000000000000@thread.skype'
      }
    });
    assert(loggerLogSpy.calledWith(
      [
        {
          "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjIzkxZmYyZTE3LTg0ZGUtNDU1YS04ODE1LTUyYjIxNjgzZjY0ZQ==",
          "roles": [],
          "displayName": "User 1",
          "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
          "userId": "00000000-0000-0000-0000-000000000001",
          "email": "user1@domainname.com",
          "tenantId": "00000000-0000-0000-0000-000000000000"
        },
        {
          "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjI2IyMDkxZTE4LTc4ODItNGVmZS1iN2QxLTkwNzAzZjVhNWM2NQ==",
          "roles": [
            "owner"
          ],
          "displayName": "User 2",
          "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
          "userId": "00000000-0000-0000-0000-000000000002",
          "email": "user2@domainname.com",
          "tenantId": "00000000-0000-0000-0000-000000000000"
        },
        {
          "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjIzg0OTg3NjNmLTJjYTItNGRmNy05OTBhLWZkNjg4NTJkOTVmOA==",
          "roles": [
            "guest"
          ],
          "displayName": "User 3",
          "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
          "userId": "00000000-0000-0000-0000-000000000003",
          "email": "user3@externaldomainname.com",
          "tenantId": "00000000-0000-0000-0000-000000000000"
        }
      ]
    ));
  });

  it('fails when filtering on member role is incorrect', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/teams/00000000-0000-0000-0000-000000000000/channels/19:00000000000000000000000000000000@thread.skype/members`) {
        return {
          value: [
            {
              "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjIzkxZmYyZTE3LTg0ZGUtNDU1YS04ODE1LTUyYjIxNjgzZjY0ZQ==",
              "roles": [],
              "displayName": "User 1",
              "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
              "userId": "00000000-0000-0000-0000-000000000001",
              "email": "user1@domainname.com",
              "tenantId": "00000000-0000-0000-0000-000000000000"
            },
            {
              "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjI2IyMDkxZTE4LTc4ODItNGVmZS1iN2QxLTkwNzAzZjVhNWM2NQ==",
              "roles": [
                "owner"
              ],
              "displayName": "User 2",
              "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
              "userId": "00000000-0000-0000-0000-000000000002",
              "email": "user2@domainname.com",
              "tenantId": "00000000-0000-0000-0000-000000000000"
            },
            {
              "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjIzg0OTg3NjNmLTJjYTItNGRmNy05OTBhLWZkNjg4NTJkOTVmOA==",
              "roles": [
                "guest"
              ],
              "displayName": "User 3",
              "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
              "userId": "00000000-0000-0000-0000-000000000003",
              "email": "user3@externaldomainname.com",
              "tenantId": "00000000-0000-0000-0000-000000000000"
            }
          ]
        };
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        output: 'json',
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:00000000000000000000000000000000@thread.skype',
        role: 'member'
      }
    });
    assert(loggerLogSpy.calledWith(
      [
        {
          "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjIzkxZmYyZTE3LTg0ZGUtNDU1YS04ODE1LTUyYjIxNjgzZjY0ZQ==",
          "roles": [],
          "displayName": "User 1",
          "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
          "userId": "00000000-0000-0000-0000-000000000001",
          "email": "user1@domainname.com",
          "tenantId": "00000000-0000-0000-0000-000000000000"
        }
      ]
    ));
  });

  it('fails when filtering on owner role is incorrect', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/teams/00000000-0000-0000-0000-000000000000/channels/19:00000000000000000000000000000000@thread.skype/members`) {
        return {
          value: [
            {
              "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjIzkxZmYyZTE3LTg0ZGUtNDU1YS04ODE1LTUyYjIxNjgzZjY0ZQ==",
              "roles": [],
              "displayName": "User 1",
              "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
              "userId": "00000000-0000-0000-0000-000000000001",
              "email": "user1@domainname.com",
              "tenantId": "00000000-0000-0000-0000-000000000000"
            },
            {
              "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjI2IyMDkxZTE4LTc4ODItNGVmZS1iN2QxLTkwNzAzZjVhNWM2NQ==",
              "roles": [
                "owner"
              ],
              "displayName": "User 2",
              "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
              "userId": "00000000-0000-0000-0000-000000000002",
              "email": "user2@domainname.com",
              "tenantId": "00000000-0000-0000-0000-000000000000"
            },
            {
              "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjIzg0OTg3NjNmLTJjYTItNGRmNy05OTBhLWZkNjg4NTJkOTVmOA==",
              "roles": [
                "guest"
              ],
              "displayName": "User 3",
              "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
              "userId": "00000000-0000-0000-0000-000000000003",
              "email": "user3@externaldomainname.com",
              "tenantId": "00000000-0000-0000-0000-000000000000"
            }
          ]
        };
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        output: 'json',
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:00000000000000000000000000000000@thread.skype',
        role: 'owner'
      }
    });
    assert(loggerLogSpy.calledWith(
      [
        {
          "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjI2IyMDkxZTE4LTc4ODItNGVmZS1iN2QxLTkwNzAzZjVhNWM2NQ==",
          "roles": [
            "owner"
          ],
          "displayName": "User 2",
          "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
          "userId": "00000000-0000-0000-0000-000000000002",
          "email": "user2@domainname.com",
          "tenantId": "00000000-0000-0000-0000-000000000000"
        }
      ]
    ));
  });

  it('fails when filtering on guest role is incorrect', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/teams/00000000-0000-0000-0000-000000000000/channels/19:00000000000000000000000000000000@thread.skype/members`) {
        return {
          value: [
            {
              "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjIzkxZmYyZTE3LTg0ZGUtNDU1YS04ODE1LTUyYjIxNjgzZjY0ZQ==",
              "roles": [],
              "displayName": "User 1",
              "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
              "userId": "00000000-0000-0000-0000-000000000001",
              "email": "user1@domainname.com",
              "tenantId": "00000000-0000-0000-0000-000000000000"
            },
            {
              "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjI2IyMDkxZTE4LTc4ODItNGVmZS1iN2QxLTkwNzAzZjVhNWM2NQ==",
              "roles": [
                "owner"
              ],
              "displayName": "User 2",
              "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
              "userId": "00000000-0000-0000-0000-000000000002",
              "email": "user2@domainname.com",
              "tenantId": "00000000-0000-0000-0000-000000000000"
            },
            {
              "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjIzg0OTg3NjNmLTJjYTItNGRmNy05OTBhLWZkNjg4NTJkOTVmOA==",
              "roles": [
                "guest"
              ],
              "displayName": "User 3",
              "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
              "userId": "00000000-0000-0000-0000-000000000003",
              "email": "user3@externaldomainname.com",
              "tenantId": "00000000-0000-0000-0000-000000000000"
            }
          ]
        };
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        output: 'json',
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:00000000000000000000000000000000@thread.skype',
        role: 'guest'
      }
    });
    assert(loggerLogSpy.calledWith(
      [
        {
          "id": "MCMjMiMjZjU4NTk3NTgtMzE3YS00NTMzLTg3MDgtNDU3ODFlOTgzYzZhIyMxOTpkNTdmY2ZmNGMzMjE0MDVhYjY5YzJhZWVlMTIzODllMkB0aHJlYWQuc2t5cGUjIzg0OTg3NjNmLTJjYTItNGRmNy05OTBhLWZkNjg4NTJkOTVmOA==",
          "roles": [
            "guest"
          ],
          "displayName": "User 3",
          "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z",
          "userId": "00000000-0000-0000-0000-000000000003",
          "email": "user3@externaldomainname.com",
          "tenantId": "00000000-0000-0000-0000-000000000000"
        }
      ]
    ));
  });
});

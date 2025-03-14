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
import command from './policy-list.js';

describe(commands.POLICY_LIST, () => {
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
      request.get
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.POLICY_LIST);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('defines correct properties for the default output', () => {
    assert.deepStrictEqual(command.defaultProperties(), ['id', 'displayName', 'isOrganizationDefault']);
  });

  it('retrieves the specified policy', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/policies/authorizationPolicy`) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#policies/authorizationPolicy/$entity",
          "@odata.id": "https://graph.microsoft.com/v2/b30f2eac-f6b4-4f87-9dcb-cdf7ae1f8923/authorizationPolicy/authorizationPolicy",
          "id": "authorizationPolicy",
          "allowInvitesFrom": "everyone",
          "allowedToSignUpEmailBasedSubscriptions": true,
          "allowedToUseSSPR": true,
          "allowEmailVerifiedUsersToJoinOrganization": true,
          "blockMsolPowerShell": null,
          "displayName": "Authorization Policy",
          "description": "Used to manage authorization related settings across the company.",
          "defaultUserRolePermissions": {
            "allowedToCreateApps": true,
            "allowedToCreateSecurityGroups": true,
            "allowedToReadOtherUsers": true,
            "permissionGrantPoliciesAssigned": [
              "ManagePermissionGrantsForSelf.microsoft-user-default-legacy"
            ]
          }
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        type: "authorization"
      }
    });
    assert(loggerLogSpy.calledWith({
      "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#policies/authorizationPolicy/$entity",
      "@odata.id": "https://graph.microsoft.com/v2/b30f2eac-f6b4-4f87-9dcb-cdf7ae1f8923/authorizationPolicy/authorizationPolicy",
      "id": "authorizationPolicy",
      "allowInvitesFrom": "everyone",
      "allowedToSignUpEmailBasedSubscriptions": true,
      "allowedToUseSSPR": true,
      "allowEmailVerifiedUsersToJoinOrganization": true,
      "blockMsolPowerShell": null,
      "displayName": "Authorization Policy",
      "description": "Used to manage authorization related settings across the company.",
      "defaultUserRolePermissions": {
        "allowedToCreateApps": true,
        "allowedToCreateSecurityGroups": true,
        "allowedToReadOtherUsers": true,
        "permissionGrantPoliciesAssigned": [
          "ManagePermissionGrantsForSelf.microsoft-user-default-legacy"
        ]
      }
    }));
  });

  it('retrieves the specified policies', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/policies/tokenLifetimePolicies`) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#policies/tokenLifetimePolicies",
          "value": [
            {
              id: 'a457c42c-0f2e-4a25-be2a-545e840add1f',
              deletedDateTime: null,
              definition: [
                '{"TokenLifetimePolicy":{"Version":1,"AccessTokenLifetime":"8:00:00"}}'
              ],
              displayName: 'TokenLifetimePolicy1',
              isOrganizationDefault: true
            }
          ]
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        type: "tokenLifetime"
      }
    });
    assert(loggerLogSpy.calledWith([
      {
        id: 'a457c42c-0f2e-4a25-be2a-545e840add1f',
        deletedDateTime: null,
        definition: [
          '{"TokenLifetimePolicy":{"Version":1,"AccessTokenLifetime":"8:00:00"}}'
        ],
        displayName: 'TokenLifetimePolicy1',
        isOrganizationDefault: true
      }
    ]));
  });

  it('retrieves all policies', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/policies/activityBasedTimeoutPolicies`) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#policies/activityBasedTimeoutPolicies",
          "value": []
        };
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/policies/authorizationPolicy`) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#policies/authorizationPolicy/$entity",
          "@odata.id": "https://graph.microsoft.com/v2/b30f2eac-f6b4-4f87-9dcb-cdf7ae1f8923/authorizationPolicy/authorizationPolicy",
          "id": "authorizationPolicy",
          "allowInvitesFrom": "everyone",
          "allowedToSignUpEmailBasedSubscriptions": true,
          "allowedToUseSSPR": true,
          "allowEmailVerifiedUsersToJoinOrganization": true,
          "blockMsolPowerShell": null,
          "displayName": "Authorization Policy",
          "description": "Used to manage authorization related settings across the company.",
          "defaultUserRolePermissions": {
            "allowedToCreateApps": true,
            "allowedToCreateSecurityGroups": true,
            "allowedToReadOtherUsers": true,
            "permissionGrantPoliciesAssigned": [
              "ManagePermissionGrantsForSelf.microsoft-user-default-legacy"
            ]
          }
        };
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/policies/claimsMappingPolicies`) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#policies/claimsMappingPolicies",
          "value": []
        };
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/policies/homeRealmDiscoveryPolicies`) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#policies/homeRealmDiscoveryPolicies",
          "value": []
        };
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/policies/identitySecurityDefaultsEnforcementPolicy`) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#policies/identitySecurityDefaultsEnforcementPolicy/$entity",
          "id": "00000000-0000-0000-0000-000000000005",
          "displayName": "Security Defaults",
          "description": "Security defaults is a set of basic identity security mechanisms recommended by Microsoft. When enabled, these recommendations will be automatically enforced in your organization. Administrators and users will be better protected from common identity related attacks.",
          "isEnabled": false
        };
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/policies/tokenLifetimePolicies`) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#policies/tokenLifetimePolicies",
          "value": [
            {
              id: 'a457c42c-0f2e-4a25-be2a-545e840add1f',
              deletedDateTime: null,
              definition: [
                '{"TokenLifetimePolicy":{"Version":1,"AccessTokenLifetime":"8:00:00"}}'
              ],
              displayName: 'TokenLifetimePolicy1',
              isOrganizationDefault: true
            }
          ]
        };
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/policies/tokenIssuancePolicies`) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#policies/tokenIssuancePolicies",
          "value": [
            {
              id: '457c8ef6-7a9c-4c9c-ba05-a12b7654c95a',
              deletedDateTime: null,
              definition: [
                '{ "TokenIssuancePolicy":{"TokenResponseSigningPolicy":"TokenOnly","SamlTokenVersion":"1.1","SigningAlgorithm":"http://www.w3.org/2001/04/xmldsig-more#rsa-sha256","Version":1}}'
              ],
              displayName: 'TokenIssuancePolicy1',
              isOrganizationDefault: true
            }
          ]
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
      }
    });
    assert(loggerLogSpy.calledWith([
      {
        "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#policies/authorizationPolicy/$entity",
        "@odata.id": "https://graph.microsoft.com/v2/b30f2eac-f6b4-4f87-9dcb-cdf7ae1f8923/authorizationPolicy/authorizationPolicy",
        "id": "authorizationPolicy",
        "allowInvitesFrom": "everyone",
        "allowedToSignUpEmailBasedSubscriptions": true,
        "allowedToUseSSPR": true,
        "allowEmailVerifiedUsersToJoinOrganization": true,
        "blockMsolPowerShell": null,
        "displayName": "Authorization Policy",
        "description": "Used to manage authorization related settings across the company.",
        "defaultUserRolePermissions": {
          "allowedToCreateApps": true,
          "allowedToCreateSecurityGroups": true,
          "allowedToReadOtherUsers": true,
          "permissionGrantPoliciesAssigned": [
            "ManagePermissionGrantsForSelf.microsoft-user-default-legacy"
          ]
        }
      },
      {
        "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#policies/identitySecurityDefaultsEnforcementPolicy/$entity",
        "id": "00000000-0000-0000-0000-000000000005",
        "displayName": "Security Defaults",
        "description": "Security defaults is a set of basic identity security mechanisms recommended by Microsoft. When enabled, these recommendations will be automatically enforced in your organization. Administrators and users will be better protected from common identity related attacks.",
        "isEnabled": false
      },
      {
        id: '457c8ef6-7a9c-4c9c-ba05-a12b7654c95a',
        deletedDateTime: null,
        definition: [
          '{ "TokenIssuancePolicy":{"TokenResponseSigningPolicy":"TokenOnly","SamlTokenVersion":"1.1","SigningAlgorithm":"http://www.w3.org/2001/04/xmldsig-more#rsa-sha256","Version":1}}'
        ],
        displayName: 'TokenIssuancePolicy1',
        isOrganizationDefault: true
      },
      {
        id: 'a457c42c-0f2e-4a25-be2a-545e840add1f',
        deletedDateTime: null,
        definition: [
          '{"TokenLifetimePolicy":{"Version":1,"AccessTokenLifetime":"8:00:00"}}'
        ],
        displayName: 'TokenLifetimePolicy1',
        isOrganizationDefault: true
      }
    ]));
  });

  it('correctly handles API OData error for specified policies', async () => {
    sinon.stub(request, 'get').rejects(new Error('An error has occurred.'));

    await assert.rejects(command.action(logger, { options: { type: "foo" } } as any), new CommandError("An error has occurred."));
  });

  it('correctly handles API OData error for all policies', async () => {
    sinon.stub(request, 'get').rejects(new Error("An error has occurred."));

    await assert.rejects(command.action(logger, { options: {} } as any), new CommandError("An error has occurred."));
  });

  it('accepts type to be activityBasedTimeout', async () => {
    const actual = await command.validate({
      options:
      {
        type: "activityBasedTimeout"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('accepts type to be authorization', async () => {
    const actual = await command.validate({
      options:
      {
        type: "authorization"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('accepts type to be claimsMapping', async () => {
    const actual = await command.validate({
      options:
      {
        type: "claimsMapping"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('accepts type to be homeRealmDiscovery', async () => {
    const actual = await command.validate({
      options:
      {
        type: "homeRealmDiscovery"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('accepts type to be identitySecurityDefaultsEnforcement', async () => {
    const actual = await command.validate({
      options:
      {
        type: "identitySecurityDefaultsEnforcement"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('accepts type to be tokenLifetime', async () => {
    const actual = await command.validate({
      options:
      {
        type: "tokenLifetime"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('accepts type to be tokenIssuance', async () => {
    const actual = await command.validate({
      options:
      {
        type: "tokenIssuance"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('rejects invalid type', async () => {
    const type = 'foo';
    const actual = await command.validate({
      options: {
        type: type
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });
});

import assert from 'assert';
import fs from 'fs';
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
import command from './app-add.js';
import * as mocks from './app-add.mock.js';

describe(commands.APP_ADD, () => {

  //#region manifests
  const basicManifest = {
    "id": "95cfe30d-ed44-4f9d-b73d-c66560f72e83",
    "acceptMappedClaims": null,
    "accessTokenAcceptedVersion": null,
    "addIns": [],
    "allowPublicClient": null,
    "appId": "ff254847-12c7-44cf-921e-8883dbd622a7",
    "appRoles": [],
    "oauth2AllowUrlPathMatching": false,
    "createdDateTime": "2022-02-07T08:51:18Z",
    "description": null,
    "certification": null,
    "disabledByMicrosoftStatus": null,
    "groupMembershipClaims": null,
    "identifierUris": [],
    "informationalUrls": {
      "termsOfService": null,
      "support": null,
      "privacy": null,
      "marketing": null
    },
    "keyCredentials": [],
    "knownClientApplications": [],
    "logoUrl": null,
    "logoutUrl": null,
    "name": "My app",
    "notes": null,
    "oauth2AllowIdTokenImplicitFlow": false,
    "oauth2AllowImplicitFlow": false,
    "oauth2Permissions": [],
    "oauth2RequirePostResponse": false,
    "optionalClaims": null,
    "orgRestrictions": [],
    "parentalControlSettings": {
      "countriesBlockedForMinors": [],
      "legalAgeGroupRule": "Allow"
    },
    "passwordCredentials": [],
    "preAuthorizedApplications": [],
    "publisherDomain": "contoso.onmicrosoft.com",
    "replyUrlsWithType": [],
    "requiredResourceAccess": [],
    "samlMetadataUrl": null,
    "serviceManagementReference": null,
    "signInUrl": null,
    "signInAudience": "AzureADMyOrg",
    "tags": [],
    "tokenEncryptionKeyId": null
  };

  const manifest = {
    ...basicManifest,
    "identifierUris": [
      "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
    ],
    "oauth2Permissions": [
      {
        "adminConsentDescription": "Access as a user",
        "adminConsentDisplayName": "Access as a user",
        "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
        "isEnabled": true,
        "lang": null,
        "origin": "Application",
        "type": "User",
        "userConsentDescription": null,
        "userConsentDisplayName": null,
        "value": "access_as_user"
      }
    ],
    "preAuthorizedApplications": [
      {
        "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
        "permissionIds": [
          "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
        ]
      },
      {
        "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
        "permissionIds": [
          "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
        ]
      }
    ],
    "replyUrlsWithType": [
      {
        "url": "http://localhost/auth",
        "type": "Spa"
      },
      {
        "url": "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth",
        "type": "Spa"
      }
    ],
    "requiredResourceAccess": [
      {
        "resourceAppId": "00000003-0000-0000-c000-000000000000",
        "resourceAccess": [
          {
            "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
            "type": "Scope"
          }
        ]
      }
    ]
  };

  const manifestWithSecret = {
    ...basicManifest,
    "passwordCredentials": [
      {
        "customKeyIdentifier": null,
        "endDate": "2022-09-14T17:30:13.968Z",
        "keyId": "5d7f98e2-5847-4d20-ad25-82e30f2ec6e0",
        "startDate": "2022-03-14T18:30:13.968Z",
        "value": null,
        "createdOn": "2022-03-14T18:30:33.2818539Z",
        "hint": "zC7",
        "displayName": "mysecret"
      }
    ]
  };
  //#endregion

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
    auth.connection.spoTenantId = '48526e9f-60c5-3000-31d7-aa1dc75ecf3c|908bel80-a04a-4422-b4a0-883d9847d110:c8e761e2-d528-34d1-8776-dc51157d619a&#xA;Tenant';
    if (!auth.connection.accessTokens[auth.defaultResource]) {
      auth.connection.accessTokens[auth.defaultResource] = {
        expiresOn: 'abc',
        accessToken: 'abc'
      };
    }
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
      request.get,
      request.patch,
      request.post,
      fs.existsSync,
      fs.readFileSync,
      fs.writeFileSync
    ]);
    (command as any).manifest = undefined;
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.APP_ADD);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('allows unknown options', () => {
    assert.strictEqual(command.allowUnknownOptions(), true);
  });

  it('creates Microsoft Entra app reg with just the name', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: 'bc724b77-da87-43a9-b385-6ebaaf969db8',
      objectId: '5b31c38c-2584-42f0-aa47-657fb3a84230',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg with the name and directory extension', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "extension_b7d8e648520f41d3b9c0fdeb91768a0a_jobGroupTracker": 'JobGroupN'
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        extension_b7d8e648520f41d3b9c0fdeb91768a0a_jobGroupTracker: 'JobGroupN'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: 'bc724b77-da87-43a9-b385-6ebaaf969db8',
      objectId: '5b31c38c-2584-42f0-aa47-657fb3a84230',
      tenantId: ''
    }));
  });

  it('creates multitenant Microsoft Entra app reg', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMultipleOrgs"
        })) {
        return {
          "id": "9b1e2c08-6e35-4134-a0ac-16ab154cd05a",
          "deletedDateTime": null,
          "appId": "62f0f128-987f-47f2-827a-be50d0d894c7",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:50:40.1806422Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMultipleOrgs",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        multitenant: true
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '62f0f128-987f-47f2-827a-be50d0d894c7',
      objectId: '9b1e2c08-6e35-4134-a0ac-16ab154cd05a',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a web app with the specified redirect URIs', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "web": {
            "redirectUris": [
              "https://myapp.azurewebsites.net",
              "http://localhost:4000"
            ]
          }
        })) {
        return {
          "id": "ff520671-4810-4d25-a10f-e565fc62a5ec",
          "deletedDateTime": null,
          "appId": "d2941a3b-aad4-49e0-8a1d-b82de0b46067",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:53:40.7071625Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [
              "https://myapp.azurewebsites.net",
              "http://localhost:4000"
            ],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        redirectUris: 'https://myapp.azurewebsites.net,http://localhost:4000',
        platform: 'web'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: 'd2941a3b-aad4-49e0-8a1d-b82de0b46067',
      objectId: 'ff520671-4810-4d25-a10f-e565fc62a5ec',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a desktop app with the specified redirect URI', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "publicClient": {
            "redirectUris": [
              "https://login.microsoftonline.com/common/oauth2/nativeclient"
            ]
          }
        })) {
        return {
          "id": "f1bb2138-bff1-491e-b082-9f447f3742b8",
          "deletedDateTime": null,
          "appId": "1ce0287c-9ccc-457e-a0cf-3ec5b734c092",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:56:17.4207858Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": [
              "https://login.microsoftonline.com/common/oauth2/nativeclient"
            ]
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        redirectUris: 'https://login.microsoftonline.com/common/oauth2/nativeclient',
        platform: 'publicClient'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '1ce0287c-9ccc-457e-a0cf-3ec5b734c092',
      objectId: 'f1bb2138-bff1-491e-b082-9f447f3742b8',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg with a secret', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "4d24b0c6-ad07-47c6-9bd8-9c167f9f758e",
          "deletedDateTime": null,
          "appId": "3c5bd51d-f1ac-4344-bd16-43396cadff14",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:58:18.7120335Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/4d24b0c6-ad07-47c6-9bd8-9c167f9f758e/addPassword') {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#microsoft.graph.passwordCredential",
          "customKeyIdentifier": null,
          "displayName": "Default",
          "endDateTime": "2120-12-31T14:58:16.875Z",
          "hint": "VtJ",
          "keyId": "17dc40d4-7c81-47dd-a3cb-41df4aed1130",
          "secretText": "VtJt.yG~V5pzbY2.xekx_0Xy_~9ozP_Ub5",
          "startDateTime": "2020-12-31T14:58:19.2307535Z"
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        withSecret: true
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '3c5bd51d-f1ac-4344-bd16-43396cadff14',
      objectId: '4d24b0c6-ad07-47c6-9bd8-9c167f9f758e',
      secrets: [{
        displayName: 'Default',
        value: 'VtJt.yG~V5pzbY2.xekx_0Xy_~9ozP_Ub5'
      }],
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg with a secret (debug)', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "4d24b0c6-ad07-47c6-9bd8-9c167f9f758e",
          "deletedDateTime": null,
          "appId": "3c5bd51d-f1ac-4344-bd16-43396cadff14",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:58:18.7120335Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/4d24b0c6-ad07-47c6-9bd8-9c167f9f758e/addPassword') {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#microsoft.graph.passwordCredential",
          "customKeyIdentifier": null,
          "displayName": "Default",
          "endDateTime": "2120-12-31T14:58:16.875Z",
          "hint": "VtJ",
          "keyId": "17dc40d4-7c81-47dd-a3cb-41df4aed1130",
          "secretText": "VtJt.yG~V5pzbY2.xekx_0Xy_~9ozP_Ub5",
          "startDateTime": "2020-12-31T14:58:19.2307535Z"
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        debug: true,
        name: 'My Microsoft Entra app',
        withSecret: true
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '3c5bd51d-f1ac-4344-bd16-43396cadff14',
      objectId: '4d24b0c6-ad07-47c6-9bd8-9c167f9f758e',
      secrets: [{
        displayName: 'Default',
        value: 'VtJt.yG~V5pzbY2.xekx_0Xy_~9ozP_Ub5'
      }],
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a daemon app with specified Microsoft Graph application permissions', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.microsoftGraphSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "62a82d76-70ea-41e2-9197-370581804d09",
                  "type": "Role"
                },
                {
                  "id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
                  "type": "Role"
                }
              ]
            }
          ]
        })) {
        return {
          "id": "b63c4be1-9c78-40b7-8619-de7172eed8de",
          "deletedDateTime": null,
          "appId": "dbfdad7a-5105-45fc-8290-eb0b0b24ac58",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T15:02:42.8048505Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "62a82d76-70ea-41e2-9197-370581804d09",
                  "type": "Role"
                },
                {
                  "id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
                  "type": "Role"
                }
              ]
            }
          ],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/b63c4be1-9c78-40b7-8619-de7172eed8de/addPassword') {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#microsoft.graph.passwordCredential",
          "customKeyIdentifier": null,
          "displayName": "Default",
          "endDateTime": "2120-12-31T15:02:40.978Z",
          "hint": "vP2",
          "keyId": "f7394450-52f6-4c04-926c-dc29398eaa1c",
          "secretText": "VtJt.yG~V5pzbY2.xekx_0Xy_~9ozP_Ub5",
          "startDateTime": "2020-12-31T15:02:43.2435402Z"
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        withSecret: true,
        apisApplication: 'https://graph.microsoft.com/Group.ReadWrite.All,https://graph.microsoft.com/Directory.Read.All'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: 'dbfdad7a-5105-45fc-8290-eb0b0b24ac58',
      objectId: 'b63c4be1-9c78-40b7-8619-de7172eed8de',
      secrets: [{
        displayName: 'Default',
        value: 'VtJt.yG~V5pzbY2.xekx_0Xy_~9ozP_Ub5'
      }],
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a daemon app with specified Microsoft Graph application and delegated permissions', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.microsoftGraphSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "06da0dbc-49e2-44d2-8312-53f166ab848a",
                  "type": "Scope"
                },
                {
                  "id": "62a82d76-70ea-41e2-9197-370581804d09",
                  "type": "Role"
                },
                {
                  "id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
                  "type": "Role"
                }
              ]
            }
          ]
        })) {
        return {
          "id": "b63c4be1-9c78-40b7-8619-de7172eed8de",
          "deletedDateTime": null,
          "appId": "dbfdad7a-5105-45fc-8290-eb0b0b24ac58",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T15:02:42.8048505Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "06da0dbc-49e2-44d2-8312-53f166ab848a",
                  "type": "Scope"
                },
                {
                  "id": "62a82d76-70ea-41e2-9197-370581804d09",
                  "type": "Role"
                },
                {
                  "id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
                  "type": "Role"
                }
              ]
            }
          ],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/b63c4be1-9c78-40b7-8619-de7172eed8de/addPassword') {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#microsoft.graph.passwordCredential",
          "customKeyIdentifier": null,
          "displayName": "Default",
          "endDateTime": "2120-12-31T15:02:40.978Z",
          "hint": "vP2",
          "keyId": "f7394450-52f6-4c04-926c-dc29398eaa1c",
          "secretText": "VtJt.yG~V5pzbY2.xekx_0Xy_~9ozP_Ub5",
          "startDateTime": "2020-12-31T15:02:43.2435402Z"
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        withSecret: true,
        apisApplication: 'https://graph.microsoft.com/Group.ReadWrite.All,https://graph.microsoft.com/Directory.Read.All',
        apisDelegated: 'https://graph.microsoft.com/Directory.Read.All'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: 'dbfdad7a-5105-45fc-8290-eb0b0b24ac58',
      objectId: 'b63c4be1-9c78-40b7-8619-de7172eed8de',
      secrets: [{
        displayName: 'Default',
        value: 'VtJt.yG~V5pzbY2.xekx_0Xy_~9ozP_Ub5'
      }],
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a single-page app with specified Microsoft Graph delegated permissions', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.microsoftGraphSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "465a38f9-76ea-45b9-9f34-9e8b0d4b0b42",
                  "type": "Scope"
                },
                {
                  "id": "06da0dbc-49e2-44d2-8312-53f166ab848a",
                  "type": "Scope"
                }
              ]
            }
          ],
          "spa": {
            "redirectUris": [
              "https://myspa.azurewebsites.net",
              "http://localhost:8080"
            ]
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": true,
              "enableIdTokenIssuance": true
            }
          }
        })) {
        return {
          "id": "f51ff52f-8f04-4924-91d0-636349eed65c",
          "deletedDateTime": null,
          "appId": "c505d465-9e4e-4bb4-b653-7b36d77cc94a",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T19:08:27.9188248Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": [
              "https://myspa.azurewebsites.net",
              "http://localhost:8080"
            ]
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "465a38f9-76ea-45b9-9f34-9e8b0d4b0b42",
                  "type": "Scope"
                },
                {
                  "id": "06da0dbc-49e2-44d2-8312-53f166ab848a",
                  "type": "Scope"
                }
              ]
            }
          ],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": true,
              "enableIdTokenIssuance": true
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        platform: 'spa',
        redirectUris: 'https://myspa.azurewebsites.net,http://localhost:8080',
        apisDelegated: 'https://graph.microsoft.com/Calendars.Read,https://graph.microsoft.com/Directory.Read.All',
        implicitFlow: true
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: 'c505d465-9e4e-4bb4-b653-7b36d77cc94a',
      objectId: 'f51ff52f-8f04-4924-91d0-636349eed65c',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a single-page app with specified Microsoft Graph delegated permissions (debug)', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.microsoftGraphSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "465a38f9-76ea-45b9-9f34-9e8b0d4b0b42",
                  "type": "Scope"
                },
                {
                  "id": "06da0dbc-49e2-44d2-8312-53f166ab848a",
                  "type": "Scope"
                }
              ]
            }
          ],
          "spa": {
            "redirectUris": [
              "https://myspa.azurewebsites.net",
              "http://localhost:8080"
            ]
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": true,
              "enableIdTokenIssuance": true
            }
          }
        })) {
        return {
          "id": "f51ff52f-8f04-4924-91d0-636349eed65c",
          "deletedDateTime": null,
          "appId": "c505d465-9e4e-4bb4-b653-7b36d77cc94a",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T19:08:27.9188248Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": [
              "https://myspa.azurewebsites.net",
              "http://localhost:8080"
            ]
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "465a38f9-76ea-45b9-9f34-9e8b0d4b0b42",
                  "type": "Scope"
                },
                {
                  "id": "06da0dbc-49e2-44d2-8312-53f166ab848a",
                  "type": "Scope"
                }
              ]
            }
          ],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": true,
              "enableIdTokenIssuance": true
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        debug: true,
        name: 'My Microsoft Entra app',
        platform: 'spa',
        redirectUris: 'https://myspa.azurewebsites.net,http://localhost:8080',
        apisDelegated: 'https://graph.microsoft.com/Calendars.Read,https://graph.microsoft.com/Directory.Read.All',
        implicitFlow: true
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: 'c505d465-9e4e-4bb4-b653-7b36d77cc94a',
      objectId: 'f51ff52f-8f04-4924-91d0-636349eed65c',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg with Application ID URI set to a fixed value', async () => {
    sinon.stub(request, 'get').rejects('Issued GET request');
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/c0e63919-057c-4e6b-be6c-8662e7aec4eb' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "identifierUris": [
            "https://contoso.onmicrosoft.com/myapp"
          ]
        })) {
        return;
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "c0e63919-057c-4e6b-be6c-8662e7aec4eb",
          "deletedDateTime": null,
          "appId": "b08d9318-5612-4f87-9f94-7414ef6f0c8a",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T19:14:23.9641082Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        uri: 'https://contoso.onmicrosoft.com/myapp'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: 'b08d9318-5612-4f87-9f94-7414ef6f0c8a',
      objectId: 'c0e63919-057c-4e6b-be6c-8662e7aec4eb',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg with Application ID URI set to a fixed value (debug)', async () => {
    sinon.stub(request, 'get').rejects('Issued GET request');
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/c0e63919-057c-4e6b-be6c-8662e7aec4eb' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "identifierUris": [
            "https://contoso.onmicrosoft.com/myapp"
          ]
        })) {
        return;
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "c0e63919-057c-4e6b-be6c-8662e7aec4eb",
          "deletedDateTime": null,
          "appId": "b08d9318-5612-4f87-9f94-7414ef6f0c8a",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T19:14:23.9641082Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        debug: true,
        name: 'My Microsoft Entra app',
        uri: 'https://contoso.onmicrosoft.com/myapp'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: 'b08d9318-5612-4f87-9f94-7414ef6f0c8a',
      objectId: 'c0e63919-057c-4e6b-be6c-8662e7aec4eb',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg with Application ID URI set to a value with the appId token and a custom scope that can be consented by admins', async () => {
    sinon.stub(request, 'get').rejects('Issued GET request');
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/fe45ba27-a692-4b11-adf8-f4ec184ea3a5') {
        const actualData = JSON.stringify(opts.data);
        const expectedData = JSON.stringify({
          "identifierUris": [
            "api://caf406b91cd4.ngrok.io/13e11551-2967-4985-8c55-cd2aaa6b80ad"
          ],
          "api": {
            "oauth2PermissionScopes": [
              {
                "adminConsentDescription": "Access as a user",
                "adminConsentDisplayName": "Access as a user",
                "id": "|",
                "type": "Admin",
                "value": "access_as_user"
              }
            ]
          }
        }).split('|');
        if (actualData.indexOf(expectedData[0]) > -1 && actualData.indexOf(expectedData[1]) > -1) {
          return;
        }
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "fe45ba27-a692-4b11-adf8-f4ec184ea3a5",
          "deletedDateTime": null,
          "appId": "13e11551-2967-4985-8c55-cd2aaa6b80ad",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T19:17:55.8423122Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        uri: 'api://caf406b91cd4.ngrok.io/_appId_',
        scopeName: 'access_as_user',
        scopeAdminConsentDescription: 'Access as a user',
        scopeAdminConsentDisplayName: 'Access as a user',
        scopeConsentBy: 'admins'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '13e11551-2967-4985-8c55-cd2aaa6b80ad',
      objectId: 'fe45ba27-a692-4b11-adf8-f4ec184ea3a5',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg with Application ID URI set to a value with the appId token and a custom scope that can be consented by admins and users', async () => {
    sinon.stub(request, 'get').rejects('Issued GET request');
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/fe45ba27-a692-4b11-adf8-f4ec184ea3a5') {
        const actualData = JSON.stringify(opts.data);
        const expectedData = JSON.stringify({
          "identifierUris": [
            "api://caf406b91cd4.ngrok.io/13e11551-2967-4985-8c55-cd2aaa6b80ad"
          ],
          "api": {
            "oauth2PermissionScopes": [
              {
                "adminConsentDescription": "Access as a user",
                "adminConsentDisplayName": "Access as a user",
                "id": "|",
                "type": "User",
                "value": "access_as_user"
              }
            ]
          }
        }).split('|');
        if (actualData.indexOf(expectedData[0]) > -1 && actualData.indexOf(expectedData[1]) > -1) {
          return;
        }
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "fe45ba27-a692-4b11-adf8-f4ec184ea3a5",
          "deletedDateTime": null,
          "appId": "13e11551-2967-4985-8c55-cd2aaa6b80ad",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T19:17:55.8423122Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        uri: 'api://caf406b91cd4.ngrok.io/_appId_',
        scopeName: 'access_as_user',
        scopeAdminConsentDescription: 'Access as a user',
        scopeAdminConsentDisplayName: 'Access as a user',
        scopeConsentBy: 'adminsAndUsers'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '13e11551-2967-4985-8c55-cd2aaa6b80ad',
      objectId: 'fe45ba27-a692-4b11-adf8-f4ec184ea3a5',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg with a certificate using certificate file', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "keyCredentials": [{
            "type": "AsymmetricX509Cert",
            "usage": "Verify",
            "displayName": "some certificate",
            "key": "somecertificatebase64string"
          }]
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(fs, 'existsSync').returns(true);
    sinon.stub(fs, 'readFileSync').returns("somecertificatebase64string");

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        certificateDisplayName: 'some certificate',
        certificateFile: 'C:\\temp\\some-certificate.cer'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: 'bc724b77-da87-43a9-b385-6ebaaf969db8',
      objectId: '5b31c38c-2584-42f0-aa47-657fb3a84230',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg with a certificate using base64 string', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "keyCredentials": [{
            "type": "AsymmetricX509Cert",
            "usage": "Verify",
            "displayName": "some certificate",
            "key": "somecertificatebase64string"
          }]
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        certificateDisplayName: 'some certificate',
        certificateBase64Encoded: 'somecertificatebase64string'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: 'bc724b77-da87-43a9-b385-6ebaaf969db8',
      objectId: '5b31c38c-2584-42f0-aa47-657fb3a84230',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a daemon app with specified Microsoft Graph permissions, including admin consent', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.microsoftGraphSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "62a82d76-70ea-41e2-9197-370581804d09",
                  "type": "Role"
                }
              ]
            }
          ]
        })) {
        return {
          "id": "b63c4be1-9c78-40b7-8619-de7172eed8de",
          "deletedDateTime": null,
          "appId": "dbfdad7a-5105-45fc-8290-eb0b0b24ac58",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T15:02:42.8048505Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "62a82d76-70ea-41e2-9197-370581804d09",
                  "type": "Role"
                }
              ]
            }
          ],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals') {
        return {
          "id": "59e617e5-e447-4adc-8b88-00af644d7c92",
          "appId": "dbfdad7a-5105-45fc-8290-eb0b0b24ac58",
          "displayName": "My Microsoft Entra app",
          "appRoles": [],
          "oauth2PermissionScopes": [],
          "servicePrincipalNames": [
            "f1bd758f-4a1a-4b71-aa20-a248a22a8928"
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/oauth2PermissionGrants') {
        return;
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals/59e617e5-e447-4adc-8b88-00af644d7c92/appRoleAssignments') {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#servicePrincipals('59e617e5-e447-4adc-8b88-00af644d7c92')/appRoleAssignments/$entity",
          "id": "vAolND43WUinlI9oBu_ynaoJXWsFy9tInKpeHJBShh4",
          "deletedDateTime": null,
          "appRoleId": "62a82d76-70ea-41e2-9197-370581804d09",
          "createdDateTime": "2022-06-08T16:09:29.4885458Z",
          "principalDisplayName": "myapp",
          "principalId": "24448e9c-d0fa-43d1-a1dd-e279720969a0",
          "principalType": "ServicePrincipal",
          "resourceDisplayName": "Microsoft Graph",
          "resourceId": "f75121cb-5156-42f0-916e-341ea2ecaa22"
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        apisApplication: 'https://graph.microsoft.com/Group.ReadWrite.All',
        grantAdminConsent: true,
        debug: true
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: 'dbfdad7a-5105-45fc-8290-eb0b0b24ac58',
      objectId: 'b63c4be1-9c78-40b7-8619-de7172eed8de',
      tenantId: ''
    }));
  });

  it('returns error when retrieving information about service principals failed', async () => {
    sinon.stub(request, 'get').rejects({
      error: {
        message: `An error has occurred`
      }
    });
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').rejects('Issued POST request');

    await assert.rejects(command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        withSecret: true,
        apisApplication: 'https://graph.microsoft.com/Group.ReadWrite.All,https://graph.microsoft.com/Directory.Read.All'
      }
    } as any), new CommandError('An error has occurred'));
  });

  it('returns error when non-existent service principal specified in the APIs', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.microsoftGraphSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "465a38f9-76ea-45b9-9f34-9e8b0d4b0b42",
                  "type": "Scope"
                },
                {
                  "id": "06da0dbc-49e2-44d2-8312-53f166ab848a",
                  "type": "Scope"
                }
              ]
            }
          ],
          "spa": {
            "redirectUris": [
              "https://myspa.azurewebsites.net",
              "http://localhost:8080"
            ]
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": true,
              "enableIdTokenIssuance": true
            }
          }
        })) {
        return {
          "id": "f51ff52f-8f04-4924-91d0-636349eed65c",
          "deletedDateTime": null,
          "appId": "c505d465-9e4e-4bb4-b653-7b36d77cc94a",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T19:08:27.9188248Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": [
              "https://myspa.azurewebsites.net",
              "http://localhost:8080"
            ]
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "465a38f9-76ea-45b9-9f34-9e8b0d4b0b42",
                  "type": "Scope"
                },
                {
                  "id": "06da0dbc-49e2-44d2-8312-53f166ab848a",
                  "type": "Scope"
                }
              ]
            }
          ],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": true,
              "enableIdTokenIssuance": true
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        platform: 'spa',
        apisDelegated: 'https://myapi.onmicrosoft.com/access_as_user',
        implicitFlow: true
      }
    } as any), new CommandError('Service principal https://myapi.onmicrosoft.com not found'));
  });

  it('returns error when non-existent permission scope specified in the APIs', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.microsoftGraphSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "465a38f9-76ea-45b9-9f34-9e8b0d4b0b42",
                  "type": "Scope"
                },
                {
                  "id": "06da0dbc-49e2-44d2-8312-53f166ab848a",
                  "type": "Scope"
                }
              ]
            }
          ],
          "spa": {
            "redirectUris": [
              "https://myspa.azurewebsites.net",
              "http://localhost:8080"
            ]
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": true,
              "enableIdTokenIssuance": true
            }
          }
        })) {
        return {
          "id": "f51ff52f-8f04-4924-91d0-636349eed65c",
          "deletedDateTime": null,
          "appId": "c505d465-9e4e-4bb4-b653-7b36d77cc94a",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T19:08:27.9188248Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": [
              "https://myspa.azurewebsites.net",
              "http://localhost:8080"
            ]
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "465a38f9-76ea-45b9-9f34-9e8b0d4b0b42",
                  "type": "Scope"
                },
                {
                  "id": "06da0dbc-49e2-44d2-8312-53f166ab848a",
                  "type": "Scope"
                }
              ]
            }
          ],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": true,
              "enableIdTokenIssuance": true
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        platform: 'spa',
        apisDelegated: 'https://graph.microsoft.com/Read.Everything',
        implicitFlow: true
      }
    } as any), new CommandError('Permission Read.Everything for service principal https://graph.microsoft.com not found'));
  });

  it('returns error when configuring secret failed', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "4d24b0c6-ad07-47c6-9bd8-9c167f9f758e",
          "deletedDateTime": null,
          "appId": "3c5bd51d-f1ac-4344-bd16-43396cadff14",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:58:18.7120335Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/4d24b0c6-ad07-47c6-9bd8-9c167f9f758e/addPassword') {
        throw {
          error: {
            message: 'An error has occurred'
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        withSecret: true
      }
    } as any), new CommandError('An error has occurred'));
  });

  it('returns error when creating the Microsoft Entra app reg failed', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').rejects({ error: { message: 'An error has occurred' } });

    await assert.rejects(command.action(logger, {
      options: {
        name: 'My Microsoft Entra app'
      }
    } as any), new CommandError('An error has occurred'));
  });

  it('returns error when setting Application ID URI failed', async () => {
    sinon.stub(request, 'get').rejects('Issued GET request');
    sinon.stub(request, 'patch').rejects({ error: { message: 'An error has occurred' } });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "c0e63919-057c-4e6b-be6c-8662e7aec4eb",
          "deletedDateTime": null,
          "appId": "b08d9318-5612-4f87-9f94-7414ef6f0c8a",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T19:14:23.9641082Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "M365x271534.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        uri: 'https://contoso.onmicrosoft.com/myapp'
      }
    } as any), new CommandError('An error has occurred'));
  });

  it('returns error when certificate file cannot be read', async () => {
    sinon.stub(fs, 'existsSync').returns(true);
    sinon.stub(fs, 'readFileSync').throws(new Error("An error has occurred"));

    await assert.rejects(command.action(logger, {
      options: {
        debug: true,
        name: 'My Microsoft Entra app',
        certificateDisplayName: 'some certificate',
        certificateFile: 'C:\\temp\\some-certificate.cer'
      }
    } as any), new CommandError(`Error reading certificate file: Error: An error has occurred. Please add the certificate using base64 option '--certificateBase64Encoded'.`));
  });

  it('creates Microsoft Entra app reg for a web app with service principal name with trailing slash', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.mockCrmSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000007-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "78ce3f0f-a1ce-49c2-8cde-64b5c0896db4",
                  "type": "Scope"
                }
              ]
            }
          ],
          "web": {
            "redirectUris": [
              "https://global.consent.azure-apim.net/redirect"
            ]
          }
        })) {
        return {
          "id": "1cd23c5f-2cb4-4bd0-a582-d5b00f578dcd",
          "deletedDateTime": null,
          "appId": "702e65ba-cacb-4a2f-aa5c-e6460967bc20",
          "applicationTemplateId": null,
          "createdDateTime": "2021-02-21T09:44:05.953701Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "m365404404.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000007-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "78ce3f0f-a1ce-49c2-8cde-64b5c0896db4",
                  "type": "Scope"
                }
              ]
            }
          ],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [
              "https://global.consent.azure-apim.net/redirect"
            ],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          },
          "spa": {
            "redirectUris": []
          }

        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        platform: 'web',
        redirectUris: 'https://global.consent.azure-apim.net/redirect',
        apisDelegated: 'https://admin.services.crm.dynamics.com/user_impersonation'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '702e65ba-cacb-4a2f-aa5c-e6460967bc20',
      objectId: '1cd23c5f-2cb4-4bd0-a582-d5b00f578dcd',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a web app from a manifest', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.mockCrmSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/3a0388de-2988-4a97-a068-ff4e2b218752' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime": "2021-02-19T08:55:14Z",
          "groupMembershipClaims": null,
          "identifierUris": [],
          "keyCredentials": [],
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000007-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "78ce3f0f-a1ce-49c2-8cde-64b5c0896db4",
                  "type": "Scope"
                }
              ]
            }
          ],
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": []
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": true,
              "enableIdTokenIssuance": true
            },
            "redirectUris": [
              "https://localhost"
            ],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": [
              "http://localhost"
            ]
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
        return;
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000007-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "78ce3f0f-a1ce-49c2-8cde-64b5c0896db4",
                  "type": "Scope"
                }
              ]
            }
          ]
        })) {
        return {
          "id": "3a0388de-2988-4a97-a068-ff4e2b218752",
          "deletedDateTime": null,
          "appId": "689d2d97-7b80-4283-9185-ee24b5648607",
          "applicationTemplateId": null,
          "createdDateTime": "2021-04-15T11:10:08.3662336Z",
          "displayName": "My app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          },
          "spa": {
            "redirectUris": []
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    const manifest = {
      "id": "c75be2e1-0204-4f95-857d-51a37cf40be8",
      "acceptMappedClaims": null,
      "accessTokenAcceptedVersion": null,
      "addIns": [],
      "allowPublicClient": null,
      "appId": "9b1b1e42-794b-4c71-93ac-5ed92488b67f",
      "appRoles": [],
      "oauth2AllowUrlPathMatching": false,
      "createdDateTime": "2021-02-19T08:55:14Z",
      "disabledByMicrosoftStatus": null,
      "groupMembershipClaims": null,
      "identifierUris": [],
      "informationalUrls": {
        "termsOfService": null,
        "support": null,
        "privacy": null,
        "marketing": null
      },
      "keyCredentials": [],
      "knownClientApplications": [],
      "logoUrl": null,
      "logoutUrl": null,
      "name": "My app",
      "oauth2AllowIdTokenImplicitFlow": true,
      "oauth2AllowImplicitFlow": true,
      "oauth2Permissions": [],
      "oauth2RequirePostResponse": false,
      "optionalClaims": null,
      "orgRestrictions": [],
      "parentalControlSettings": {
        "countriesBlockedForMinors": [],
        "legalAgeGroupRule": "Allow"
      },
      "passwordCredentials": [],
      "preAuthorizedApplications": [],
      "publisherDomain": "contoso.onmicrosoft.com",
      "replyUrlsWithType": [
        {
          "url": "https://localhost",
          "type": "Web"
        },
        {
          "url": "http://localhost",
          "type": "Spa"
        }
      ],
      "requiredResourceAccess": [
        {
          "resourceAppId": "00000007-0000-0000-c000-000000000000",
          "resourceAccess": [
            {
              "id": "78ce3f0f-a1ce-49c2-8cde-64b5c0896db4",
              "type": "Scope"
            }
          ]
        }
      ],
      "samlMetadataUrl": null,
      "signInUrl": null,
      "signInAudience": "AzureADMyOrg",
      "tags": [],
      "tokenEncryptionKeyId": null
    };

    (command as any).manifest = manifest;
    await command.action(logger, {
      options: {
        manifest: JSON.stringify(manifest)
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '689d2d97-7b80-4283-9185-ee24b5648607',
      objectId: '3a0388de-2988-4a97-a068-ff4e2b218752',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a web app from a manifest with non-existent scope', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.mockCrmSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/3a0388de-2988-4a97-a068-ff4e2b218752' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime": "2021-02-19T08:55:14Z",
          "groupMembershipClaims": null,
          "identifierUris": [],
          "keyCredentials": [],
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000007-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "b70bd8bd-e3cf-4058-8abb-780555a63ef3",
                  "type": "Scope"
                }
              ]
            }
          ],
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": []
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": true,
              "enableIdTokenIssuance": true
            },
            "redirectUris": [
              "https://localhost"
            ],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": [
              "http://localhost"
            ]
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
        return;
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000007-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "b70bd8bd-e3cf-4058-8abb-780555a63ef3",
                  "type": "Scope"
                }
              ]
            }
          ]
        })) {
        return {
          "id": "3a0388de-2988-4a97-a068-ff4e2b218752",
          "deletedDateTime": null,
          "appId": "689d2d97-7b80-4283-9185-ee24b5648607",
          "applicationTemplateId": null,
          "createdDateTime": "2021-04-15T11:10:08.3662336Z",
          "displayName": "My app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          },
          "spa": {
            "redirectUris": []
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    const manifest = {
      "id": "c75be2e1-0204-4f95-857d-51a37cf40be8",
      "acceptMappedClaims": null,
      "accessTokenAcceptedVersion": null,
      "addIns": [],
      "allowPublicClient": null,
      "appId": "9b1b1e42-794b-4c71-93ac-5ed92488b67f",
      "appRoles": [],
      "oauth2AllowUrlPathMatching": false,
      "createdDateTime": "2021-02-19T08:55:14Z",
      "disabledByMicrosoftStatus": null,
      "groupMembershipClaims": null,
      "identifierUris": [],
      "informationalUrls": {
        "termsOfService": null,
        "support": null,
        "privacy": null,
        "marketing": null
      },
      "keyCredentials": [],
      "knownClientApplications": [],
      "logoUrl": null,
      "logoutUrl": null,
      "name": "My app",
      "oauth2AllowIdTokenImplicitFlow": true,
      "oauth2AllowImplicitFlow": true,
      "oauth2Permissions": [],
      "oauth2RequirePostResponse": false,
      "optionalClaims": null,
      "orgRestrictions": [],
      "parentalControlSettings": {
        "countriesBlockedForMinors": [],
        "legalAgeGroupRule": "Allow"
      },
      "passwordCredentials": [],
      "preAuthorizedApplications": [],
      "publisherDomain": "contoso.onmicrosoft.com",
      "replyUrlsWithType": [
        {
          "url": "https://localhost",
          "type": "Web"
        },
        {
          "url": "http://localhost",
          "type": "Spa"
        }
      ],
      "requiredResourceAccess": [
        {
          "resourceAppId": "00000007-0000-0000-c000-000000000000",
          "resourceAccess": [
            {
              "id": "b70bd8bd-e3cf-4058-8abb-780555a63ef3", //non-existent CRM scope id
              "type": "Scope"
            }
          ]
        }
      ],
      "samlMetadataUrl": null,
      "signInUrl": null,
      "signInAudience": "AzureADMyOrg",
      "tags": [],
      "tokenEncryptionKeyId": null
    };

    (command as any).manifest = manifest;
    await command.action(logger, {
      options: {
        manifest: JSON.stringify(manifest)
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '689d2d97-7b80-4283-9185-ee24b5648607',
      objectId: '3a0388de-2988-4a97-a068-ff4e2b218752',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a web app from a manifest without info URLs', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.mockCrmSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/3a0388de-2988-4a97-a068-ff4e2b218752' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime": "2021-02-19T08:55:14Z",
          "groupMembershipClaims": null,
          "identifierUris": [],
          "keyCredentials": [],
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000007-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "78ce3f0f-a1ce-49c2-8cde-64b5c0896db4",
                  "type": "Scope"
                }
              ]
            }
          ],
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": []
          },
          "info": {},
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": true,
              "enableIdTokenIssuance": true
            },
            "redirectUris": [
              "https://localhost"
            ],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": [
              "http://localhost"
            ]
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
        return;
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000007-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "78ce3f0f-a1ce-49c2-8cde-64b5c0896db4",
                  "type": "Scope"
                }
              ]
            }
          ]
        })) {
        return {
          "id": "3a0388de-2988-4a97-a068-ff4e2b218752",
          "deletedDateTime": null,
          "appId": "689d2d97-7b80-4283-9185-ee24b5648607",
          "applicationTemplateId": null,
          "createdDateTime": "2021-04-15T11:10:08.3662336Z",
          "displayName": "My app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          },
          "spa": {
            "redirectUris": []
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    const manifest = {
      "id": "c75be2e1-0204-4f95-857d-51a37cf40be8",
      "acceptMappedClaims": null,
      "accessTokenAcceptedVersion": null,
      "addIns": [],
      "allowPublicClient": null,
      "appId": "9b1b1e42-794b-4c71-93ac-5ed92488b67f",
      "appRoles": [],
      "oauth2AllowUrlPathMatching": false,
      "createdDateTime": "2021-02-19T08:55:14Z",
      "disabledByMicrosoftStatus": null,
      "groupMembershipClaims": null,
      "identifierUris": [],
      "keyCredentials": [],
      "knownClientApplications": [],
      "logoutUrl": null,
      "name": "My app",
      "oauth2AllowIdTokenImplicitFlow": true,
      "oauth2AllowImplicitFlow": true,
      "oauth2Permissions": [],
      "oauth2RequirePostResponse": false,
      "optionalClaims": null,
      "orgRestrictions": [],
      "parentalControlSettings": {
        "countriesBlockedForMinors": [],
        "legalAgeGroupRule": "Allow"
      },
      "passwordCredentials": [],
      "preAuthorizedApplications": [],
      "publisherDomain": "contoso.onmicrosoft.com",
      "replyUrlsWithType": [
        {
          "url": "https://localhost",
          "type": "Web"
        },
        {
          "url": "http://localhost",
          "type": "Spa"
        }
      ],
      "requiredResourceAccess": [
        {
          "resourceAppId": "00000007-0000-0000-c000-000000000000",
          "resourceAccess": [
            {
              "id": "78ce3f0f-a1ce-49c2-8cde-64b5c0896db4",
              "type": "Scope"
            }
          ]
        }
      ],
      "samlMetadataUrl": null,
      "signInUrl": null,
      "signInAudience": "AzureADMyOrg",
      "tags": [],
      "tokenEncryptionKeyId": null
    };

    (command as any).manifest = manifest;
    await command.action(logger, {
      options: {
        manifest: JSON.stringify(manifest)
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '689d2d97-7b80-4283-9185-ee24b5648607',
      objectId: '3a0388de-2988-4a97-a068-ff4e2b218752',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a web app from a manifest with pre-authorized apps', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.mockCrmSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/bcac8603-cf65-479b-a4e5-8d45d3d05379') {
        if (JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime": "2022-02-07T08:51:18Z",
          "description": null,
          "certification": null,
          "groupMembershipClaims": null,
          "identifierUris": [
            "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
          ],
          "keyCredentials": [],
          "notes": null,
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ],
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": [
              {
                "adminConsentDescription": "Access as a user",
                "adminConsentDisplayName": "Access as a user",
                "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
                "isEnabled": true,
                "type": "User",
                "userConsentDescription": null,
                "userConsentDisplayName": null,
                "value": "access_as_user"
              }
            ]
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            },
            "redirectUris": [],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": [
              "http://localhost/auth",
              "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth"
            ]
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
          return;
        }

        if (JSON.stringify(opts.data) === JSON.stringify({
          "api": {
            "preAuthorizedApplications": [
              {
                "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              },
              {
                "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              }
            ]
          }
        })) {
          return;
        }
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ]
        })) {
        return {
          "id": "bcac8603-cf65-479b-a4e5-8d45d3d05379",
          "deletedDateTime": null,
          "appId": "19180b97-8f30-43ac-8a22-19565de0b064",
          "applicationTemplateId": null,
          "disabledByMicrosoftStatus": null,
          "createdDateTime": "2022-02-10T08:06:59.5299702Z",
          "displayName": "Angular Teams app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "publisherDomain": "M365x61791022.onmicrosoft.com",
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "defaultRedirectUri": null,
          "certification": null,
          "optionalClaims": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          },
          "spa": {
            "redirectUris": []
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    const manifest = {
      "id": "95cfe30d-ed44-4f9d-b73d-c66560f72e83",
      "acceptMappedClaims": null,
      "accessTokenAcceptedVersion": null,
      "addIns": [],
      "allowPublicClient": null,
      "appId": "ff254847-12c7-44cf-921e-8883dbd622a7",
      "appRoles": [],
      "oauth2AllowUrlPathMatching": false,
      "createdDateTime": "2022-02-07T08:51:18Z",
      "description": null,
      "certification": null,
      "disabledByMicrosoftStatus": null,
      "groupMembershipClaims": null,
      "identifierUris": [
        "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
      ],
      "informationalUrls": {
        "termsOfService": null,
        "support": null,
        "privacy": null,
        "marketing": null
      },
      "keyCredentials": [],
      "knownClientApplications": [],
      "logoUrl": null,
      "logoutUrl": null,
      "name": "My app",
      "notes": null,
      "oauth2AllowIdTokenImplicitFlow": false,
      "oauth2AllowImplicitFlow": false,
      "oauth2Permissions": [
        {
          "adminConsentDescription": "Access as a user",
          "adminConsentDisplayName": "Access as a user",
          "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
          "isEnabled": true,
          "lang": null,
          "origin": "Application",
          "type": "User",
          "userConsentDescription": null,
          "userConsentDisplayName": null,
          "value": "access_as_user"
        }
      ],
      "oauth2RequirePostResponse": false,
      "optionalClaims": null,
      "orgRestrictions": [],
      "parentalControlSettings": {
        "countriesBlockedForMinors": [],
        "legalAgeGroupRule": "Allow"
      },
      "passwordCredentials": [],
      "preAuthorizedApplications": [
        {
          "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
          "permissionIds": [
            "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
          ]
        },
        {
          "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
          "permissionIds": [
            "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
          ]
        }
      ],
      "publisherDomain": "contoso.onmicrosoft.com",
      "replyUrlsWithType": [
        {
          "url": "http://localhost/auth",
          "type": "Spa"
        },
        {
          "url": "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth",
          "type": "Spa"
        }
      ],
      "requiredResourceAccess": [
        {
          "resourceAppId": "00000003-0000-0000-c000-000000000000",
          "resourceAccess": [
            {
              "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
              "type": "Scope"
            }
          ]
        }
      ],
      "samlMetadataUrl": null,
      "serviceManagementReference": null,
      "signInUrl": null,
      "signInAudience": "AzureADMyOrg",
      "tags": [],
      "tokenEncryptionKeyId": null
    };

    (command as any).manifest = manifest;
    await command.action(logger, {
      options: {
        manifest: JSON.stringify(manifest)
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '19180b97-8f30-43ac-8a22-19565de0b064',
      objectId: 'bcac8603-cf65-479b-a4e5-8d45d3d05379',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a web app from a manifest with public client flows enabled', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.mockCrmSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/bcac8603-cf65-479b-a4e5-8d45d3d05379') {
        if (JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime": "2022-02-07T08:51:18Z",
          "description": null,
          "certification": null,
          "groupMembershipClaims": null,
          "identifierUris": [
            "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
          ],
          "keyCredentials": [],
          "notes": null,
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ],
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": [
              {
                "adminConsentDescription": "Access as a user",
                "adminConsentDisplayName": "Access as a user",
                "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
                "isEnabled": true,
                "type": "User",
                "userConsentDescription": null,
                "userConsentDisplayName": null,
                "value": "access_as_user"
              }
            ]
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            },
            "redirectUris": [],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": [
              "http://localhost/auth",
              "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth"
            ]
          },
          "isFallbackPublicClient": true,
          "displayName": "My app"
        })) {
          return;
        }

        if (JSON.stringify(opts.data) === JSON.stringify({
          "api": {
            "preAuthorizedApplications": [
              {
                "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              },
              {
                "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              }
            ]
          }
        })) {
          return;
        }
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ]
        })) {
        return {
          "id": "bcac8603-cf65-479b-a4e5-8d45d3d05379",
          "deletedDateTime": null,
          "appId": "19180b97-8f30-43ac-8a22-19565de0b064",
          "applicationTemplateId": null,
          "disabledByMicrosoftStatus": null,
          "createdDateTime": "2022-02-10T08:06:59.5299702Z",
          "displayName": "Angular Teams app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "publisherDomain": "M365x61791022.onmicrosoft.com",
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "defaultRedirectUri": null,
          "certification": null,
          "optionalClaims": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          },
          "spa": {
            "redirectUris": []
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    const manifest = {
      "id": "95cfe30d-ed44-4f9d-b73d-c66560f72e83",
      "acceptMappedClaims": null,
      "accessTokenAcceptedVersion": null,
      "addIns": [],
      "allowPublicClient": true,
      "appId": "ff254847-12c7-44cf-921e-8883dbd622a7",
      "appRoles": [],
      "oauth2AllowUrlPathMatching": false,
      "createdDateTime": "2022-02-07T08:51:18Z",
      "description": null,
      "certification": null,
      "disabledByMicrosoftStatus": null,
      "groupMembershipClaims": null,
      "identifierUris": [
        "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
      ],
      "informationalUrls": {
        "termsOfService": null,
        "support": null,
        "privacy": null,
        "marketing": null
      },
      "keyCredentials": [],
      "knownClientApplications": [],
      "logoUrl": null,
      "logoutUrl": null,
      "name": "My app",
      "notes": null,
      "oauth2AllowIdTokenImplicitFlow": false,
      "oauth2AllowImplicitFlow": false,
      "oauth2Permissions": [
        {
          "adminConsentDescription": "Access as a user",
          "adminConsentDisplayName": "Access as a user",
          "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
          "isEnabled": true,
          "lang": null,
          "origin": "Application",
          "type": "User",
          "userConsentDescription": null,
          "userConsentDisplayName": null,
          "value": "access_as_user"
        }
      ],
      "oauth2RequirePostResponse": false,
      "optionalClaims": null,
      "orgRestrictions": [],
      "parentalControlSettings": {
        "countriesBlockedForMinors": [],
        "legalAgeGroupRule": "Allow"
      },
      "passwordCredentials": [],
      "preAuthorizedApplications": [
        {
          "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
          "permissionIds": [
            "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
          ]
        },
        {
          "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
          "permissionIds": [
            "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
          ]
        }
      ],
      "publisherDomain": "contoso.onmicrosoft.com",
      "replyUrlsWithType": [
        {
          "url": "http://localhost/auth",
          "type": "Spa"
        },
        {
          "url": "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth",
          "type": "Spa"
        }
      ],
      "requiredResourceAccess": [
        {
          "resourceAppId": "00000003-0000-0000-c000-000000000000",
          "resourceAccess": [
            {
              "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
              "type": "Scope"
            }
          ]
        }
      ],
      "samlMetadataUrl": null,
      "serviceManagementReference": null,
      "signInUrl": null,
      "signInAudience": "AzureADMyOrg",
      "tags": [],
      "tokenEncryptionKeyId": null
    };

    (command as any).manifest = manifest;
    await command.action(logger, {
      options: {
        manifest: JSON.stringify(manifest)
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '19180b97-8f30-43ac-8a22-19565de0b064',
      objectId: 'bcac8603-cf65-479b-a4e5-8d45d3d05379',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a web app from a manifest with public client flows disabled', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.mockCrmSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/bcac8603-cf65-479b-a4e5-8d45d3d05379') {
        if (JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime": "2022-02-07T08:51:18Z",
          "description": null,
          "certification": null,
          "groupMembershipClaims": null,
          "identifierUris": [
            "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
          ],
          "keyCredentials": [],
          "notes": null,
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ],
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": [
              {
                "adminConsentDescription": "Access as a user",
                "adminConsentDisplayName": "Access as a user",
                "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
                "isEnabled": true,
                "type": "User",
                "userConsentDescription": null,
                "userConsentDisplayName": null,
                "value": "access_as_user"
              }
            ]
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            },
            "redirectUris": [],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": [
              "http://localhost/auth",
              "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth"
            ]
          },
          "isFallbackPublicClient": false,
          "displayName": "My app"
        })) {
          return;
        }

        if (JSON.stringify(opts.data) === JSON.stringify({
          "api": {
            "preAuthorizedApplications": [
              {
                "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              },
              {
                "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              }
            ]
          }
        })) {
          return;
        }
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ]
        })) {
        return {
          "id": "bcac8603-cf65-479b-a4e5-8d45d3d05379",
          "deletedDateTime": null,
          "appId": "19180b97-8f30-43ac-8a22-19565de0b064",
          "applicationTemplateId": null,
          "disabledByMicrosoftStatus": null,
          "createdDateTime": "2022-02-10T08:06:59.5299702Z",
          "displayName": "Angular Teams app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "publisherDomain": "M365x61791022.onmicrosoft.com",
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "defaultRedirectUri": null,
          "certification": null,
          "optionalClaims": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          },
          "spa": {
            "redirectUris": []
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    const manifest = {
      "id": "95cfe30d-ed44-4f9d-b73d-c66560f72e83",
      "acceptMappedClaims": null,
      "accessTokenAcceptedVersion": null,
      "addIns": [],
      "allowPublicClient": false,
      "appId": "ff254847-12c7-44cf-921e-8883dbd622a7",
      "appRoles": [],
      "oauth2AllowUrlPathMatching": false,
      "createdDateTime": "2022-02-07T08:51:18Z",
      "description": null,
      "certification": null,
      "disabledByMicrosoftStatus": null,
      "groupMembershipClaims": null,
      "identifierUris": [
        "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
      ],
      "informationalUrls": {
        "termsOfService": null,
        "support": null,
        "privacy": null,
        "marketing": null
      },
      "keyCredentials": [],
      "knownClientApplications": [],
      "logoUrl": null,
      "logoutUrl": null,
      "name": "My app",
      "notes": null,
      "oauth2AllowIdTokenImplicitFlow": false,
      "oauth2AllowImplicitFlow": false,
      "oauth2Permissions": [
        {
          "adminConsentDescription": "Access as a user",
          "adminConsentDisplayName": "Access as a user",
          "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
          "isEnabled": true,
          "lang": null,
          "origin": "Application",
          "type": "User",
          "userConsentDescription": null,
          "userConsentDisplayName": null,
          "value": "access_as_user"
        }
      ],
      "oauth2RequirePostResponse": false,
      "optionalClaims": null,
      "orgRestrictions": [],
      "parentalControlSettings": {
        "countriesBlockedForMinors": [],
        "legalAgeGroupRule": "Allow"
      },
      "passwordCredentials": [],
      "preAuthorizedApplications": [
        {
          "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
          "permissionIds": [
            "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
          ]
        },
        {
          "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
          "permissionIds": [
            "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
          ]
        }
      ],
      "publisherDomain": "contoso.onmicrosoft.com",
      "replyUrlsWithType": [
        {
          "url": "http://localhost/auth",
          "type": "Spa"
        },
        {
          "url": "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth",
          "type": "Spa"
        }
      ],
      "requiredResourceAccess": [
        {
          "resourceAppId": "00000003-0000-0000-c000-000000000000",
          "resourceAccess": [
            {
              "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
              "type": "Scope"
            }
          ]
        }
      ],
      "samlMetadataUrl": null,
      "serviceManagementReference": null,
      "signInUrl": null,
      "signInAudience": "AzureADMyOrg",
      "tags": [],
      "tokenEncryptionKeyId": null
    };

    (command as any).manifest = manifest;
    await command.action(logger, {
      options: {
        manifest: JSON.stringify(manifest)
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '19180b97-8f30-43ac-8a22-19565de0b064',
      objectId: 'bcac8603-cf65-479b-a4e5-8d45d3d05379',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a web app from a manifest with secrets', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.mockCrmSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/bcac8603-cf65-479b-a4e5-8d45d3d05379') {
        if (JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime": "2022-02-07T08:51:18Z",
          "description": null,
          "certification": null,
          "groupMembershipClaims": null,
          "identifierUris": [
            "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
          ],
          "keyCredentials": [],
          "notes": null,
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ],
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": [
              {
                "adminConsentDescription": "Access as a user",
                "adminConsentDisplayName": "Access as a user",
                "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
                "isEnabled": true,
                "type": "User",
                "userConsentDescription": null,
                "userConsentDisplayName": null,
                "value": "access_as_user"
              }
            ]
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            },
            "redirectUris": [],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": [
              "http://localhost/auth",
              "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth"
            ]
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
          return;
        }
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ]
        })) {
        return {
          "id": "bcac8603-cf65-479b-a4e5-8d45d3d05379",
          "deletedDateTime": null,
          "appId": "19180b97-8f30-43ac-8a22-19565de0b064",
          "applicationTemplateId": null,
          "disabledByMicrosoftStatus": null,
          "createdDateTime": "2022-02-10T08:06:59.5299702Z",
          "displayName": "Angular Teams app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "publisherDomain": "M365x61791022.onmicrosoft.com",
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "defaultRedirectUri": null,
          "certification": null,
          "optionalClaims": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          },
          "spa": {
            "redirectUris": []
          }
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/bcac8603-cf65-479b-a4e5-8d45d3d05379/addPassword') {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#microsoft.graph.passwordCredential",
          "customKeyIdentifier": null,
          "displayName": "mysecret",
          "endDateTime": "2120-12-31T14:58:16.875Z",
          "hint": "VtJ",
          "keyId": "17dc40d4-7c81-47dd-a3cb-41df4aed1130",
          "secretText": "VtJt.yG~V5pzbY2.xekx_0Xy_~9ozP_Ub5",
          "startDateTime": "2020-12-31T14:58:19.2307535Z"
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    const manifest = {
      "id": "95cfe30d-ed44-4f9d-b73d-c66560f72e83",
      "acceptMappedClaims": null,
      "accessTokenAcceptedVersion": null,
      "addIns": [],
      "allowPublicClient": null,
      "appId": "ff254847-12c7-44cf-921e-8883dbd622a7",
      "appRoles": [],
      "oauth2AllowUrlPathMatching": false,
      "createdDateTime": "2022-02-07T08:51:18Z",
      "description": null,
      "certification": null,
      "disabledByMicrosoftStatus": null,
      "groupMembershipClaims": null,
      "identifierUris": [
        "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
      ],
      "informationalUrls": {
        "termsOfService": null,
        "support": null,
        "privacy": null,
        "marketing": null
      },
      "keyCredentials": [],
      "knownClientApplications": [],
      "logoUrl": null,
      "logoutUrl": null,
      "name": "My app",
      "notes": null,
      "oauth2AllowIdTokenImplicitFlow": false,
      "oauth2AllowImplicitFlow": false,
      "oauth2Permissions": [
        {
          "adminConsentDescription": "Access as a user",
          "adminConsentDisplayName": "Access as a user",
          "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
          "isEnabled": true,
          "lang": null,
          "origin": "Application",
          "type": "User",
          "userConsentDescription": null,
          "userConsentDisplayName": null,
          "value": "access_as_user"
        }
      ],
      "oauth2RequirePostResponse": false,
      "optionalClaims": null,
      "orgRestrictions": [],
      "parentalControlSettings": {
        "countriesBlockedForMinors": [],
        "legalAgeGroupRule": "Allow"
      },
      "passwordCredentials": [
        {
          "customKeyIdentifier": null,
          "endDate": "2022-09-14T17:30:13.968Z",
          "keyId": "5d7f98e2-5847-4d20-ad25-82e30f2ec6e0",
          "startDate": "2022-03-14T18:30:13.968Z",
          "value": null,
          "createdOn": "2022-03-14T18:30:33.2818539Z",
          "hint": "zC7",
          "displayName": "mysecret"
        }
      ],
      "preAuthorizedApplications": [],
      "publisherDomain": "contoso.onmicrosoft.com",
      "replyUrlsWithType": [
        {
          "url": "http://localhost/auth",
          "type": "Spa"
        },
        {
          "url": "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth",
          "type": "Spa"
        }
      ],
      "requiredResourceAccess": [
        {
          "resourceAppId": "00000003-0000-0000-c000-000000000000",
          "resourceAccess": [
            {
              "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
              "type": "Scope"
            }
          ]
        }
      ],
      "samlMetadataUrl": null,
      "serviceManagementReference": null,
      "signInUrl": null,
      "signInAudience": "AzureADMyOrg",
      "tags": [],
      "tokenEncryptionKeyId": null
    };

    (command as any).manifest = manifest;
    await command.action(logger, {
      options: {
        manifest: JSON.stringify(manifest)
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '19180b97-8f30-43ac-8a22-19565de0b064',
      objectId: 'bcac8603-cf65-479b-a4e5-8d45d3d05379',
      tenantId: '',
      secrets: [{
        "displayName": "mysecret",
        "value": "VtJt.yG~V5pzbY2.xekx_0Xy_~9ozP_Ub5"
      }]
    }));
  });

  it('creates Microsoft Entra app reg for a web app from a manifest with app roles', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.mockCrmSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/bcac8603-cf65-479b-a4e5-8d45d3d05379') {
        if (JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [
            {
              "allowedMemberTypes": [
                "User"
              ],
              "description": "myAppRole",
              "displayName": "myAppRole",
              "id": "d212e66a-8927-469d-be76-f121e287ffb0",
              "isEnabled": true,
              "origin": "Application",
              "value": "123"
            }
          ],
          "createdDateTime": "2022-02-07T08:51:18Z",
          "description": null,
          "certification": null,
          "groupMembershipClaims": null,
          "identifierUris": [
            "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
          ],
          "keyCredentials": [],
          "notes": null,
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ],
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": [
              {
                "adminConsentDescription": "Access as a user",
                "adminConsentDisplayName": "Access as a user",
                "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
                "isEnabled": true,
                "type": "User",
                "userConsentDescription": null,
                "userConsentDisplayName": null,
                "value": "access_as_user"
              }
            ]
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            },
            "redirectUris": [],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": [
              "http://localhost/auth",
              "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth"
            ]
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
          return;
        }

        if (JSON.stringify(opts.data) === JSON.stringify({
          "api": {
            "preAuthorizedApplications": [
              {
                "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              },
              {
                "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              }
            ]
          }
        })) {
          return;
        }
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ]
        })) {
        return {
          "id": "bcac8603-cf65-479b-a4e5-8d45d3d05379",
          "deletedDateTime": null,
          "appId": "19180b97-8f30-43ac-8a22-19565de0b064",
          "applicationTemplateId": null,
          "disabledByMicrosoftStatus": null,
          "createdDateTime": "2022-02-10T08:06:59.5299702Z",
          "displayName": "Angular Teams app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "publisherDomain": "M365x61791022.onmicrosoft.com",
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "defaultRedirectUri": null,
          "certification": null,
          "optionalClaims": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          },
          "spa": {
            "redirectUris": []
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    const manifest = {
      "id": "95cfe30d-ed44-4f9d-b73d-c66560f72e83",
      "acceptMappedClaims": null,
      "accessTokenAcceptedVersion": null,
      "addIns": [],
      "allowPublicClient": null,
      "appId": "ff254847-12c7-44cf-921e-8883dbd622a7",
      "appRoles": [
        {
          "allowedMemberTypes": [
            "User"
          ],
          "description": "myAppRole",
          "displayName": "myAppRole",
          "id": "d212e66a-8927-469d-be76-f121e287ffb0",
          "isEnabled": true,
          "lang": null,
          "origin": "Application",
          "value": "123"
        }
      ],
      "oauth2AllowUrlPathMatching": false,
      "createdDateTime": "2022-02-07T08:51:18Z",
      "description": null,
      "certification": null,
      "disabledByMicrosoftStatus": null,
      "groupMembershipClaims": null,
      "identifierUris": [
        "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
      ],
      "informationalUrls": {
        "termsOfService": null,
        "support": null,
        "privacy": null,
        "marketing": null
      },
      "keyCredentials": [],
      "knownClientApplications": [],
      "logoUrl": null,
      "logoutUrl": null,
      "name": "My app",
      "notes": null,
      "oauth2AllowIdTokenImplicitFlow": false,
      "oauth2AllowImplicitFlow": false,
      "oauth2Permissions": [
        {
          "adminConsentDescription": "Access as a user",
          "adminConsentDisplayName": "Access as a user",
          "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
          "isEnabled": true,
          "lang": null,
          "origin": "Application",
          "type": "User",
          "userConsentDescription": null,
          "userConsentDisplayName": null,
          "value": "access_as_user"
        }
      ],
      "oauth2RequirePostResponse": false,
      "optionalClaims": null,
      "orgRestrictions": [],
      "parentalControlSettings": {
        "countriesBlockedForMinors": [],
        "legalAgeGroupRule": "Allow"
      },
      "passwordCredentials": [],
      "preAuthorizedApplications": [
        {
          "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
          "permissionIds": [
            "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
          ]
        },
        {
          "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
          "permissionIds": [
            "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
          ]
        }
      ],
      "publisherDomain": "contoso.onmicrosoft.com",
      "replyUrlsWithType": [
        {
          "url": "http://localhost/auth",
          "type": "Spa"
        },
        {
          "url": "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth",
          "type": "Spa"
        }
      ],
      "requiredResourceAccess": [
        {
          "resourceAppId": "00000003-0000-0000-c000-000000000000",
          "resourceAccess": [
            {
              "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
              "type": "Scope"
            }
          ]
        }
      ],
      "samlMetadataUrl": null,
      "serviceManagementReference": null,
      "signInUrl": null,
      "signInAudience": "AzureADMyOrg",
      "tags": [],
      "tokenEncryptionKeyId": null
    };

    (command as any).manifest = manifest;
    await command.action(logger, {
      options: {
        manifest: JSON.stringify(manifest)
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '19180b97-8f30-43ac-8a22-19565de0b064',
      objectId: 'bcac8603-cf65-479b-a4e5-8d45d3d05379',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a web app from a manifest with app roles and specified Microsoft Graph application permissions', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.microsoftGraphSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/bcac8603-cf65-479b-a4e5-8d45d3d05379') {
        if (JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [
            {
              "allowedMemberTypes": [
                "User"
              ],
              "description": "myAppRole",
              "displayName": "myAppRole",
              "id": "d212e66a-8927-469d-be76-f121e287ffb0",
              "isEnabled": true,
              "origin": "Application",
              "value": "123"
            }
          ],
          "createdDateTime": "2022-02-07T08:51:18Z",
          "description": null,
          "certification": null,
          "groupMembershipClaims": null,
          "identifierUris": [
            "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
          ],
          "keyCredentials": [],
          "notes": null,
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "62a82d76-70ea-41e2-9197-370581804d09",
                  "type": "Role"
                },
                {
                  "id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
                  "type": "Role"
                },
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ],
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": [
              {
                "adminConsentDescription": "Access as a user",
                "adminConsentDisplayName": "Access as a user",
                "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
                "isEnabled": true,
                "type": "User",
                "userConsentDescription": null,
                "userConsentDisplayName": null,
                "value": "access_as_user"
              }
            ]
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            },
            "redirectUris": [],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": [
              "http://localhost/auth",
              "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth"
            ]
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
          return;
        }

        if (JSON.stringify(opts.data) === JSON.stringify({
          "api": {
            "preAuthorizedApplications": [
              {
                "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              },
              {
                "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              }
            ]
          }
        })) {
          return;
        }
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "62a82d76-70ea-41e2-9197-370581804d09",
                  "type": "Role"
                },
                {
                  "id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
                  "type": "Role"
                }
              ]
            }
          ]
        })) {
        return {
          "id": "bcac8603-cf65-479b-a4e5-8d45d3d05379",
          "deletedDateTime": null,
          "appId": "19180b97-8f30-43ac-8a22-19565de0b064",
          "applicationTemplateId": null,
          "disabledByMicrosoftStatus": null,
          "createdDateTime": "2022-02-10T08:06:59.5299702Z",
          "displayName": "Angular Teams app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "publisherDomain": "M365x61791022.onmicrosoft.com",
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "defaultRedirectUri": null,
          "certification": null,
          "optionalClaims": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "62a82d76-70ea-41e2-9197-370581804d09",
                  "type": "Role"
                },
                {
                  "id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
                  "type": "Role"
                },
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ],
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          },
          "spa": {
            "redirectUris": []
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    const manifest = {
      "id": "95cfe30d-ed44-4f9d-b73d-c66560f72e83",
      "acceptMappedClaims": null,
      "accessTokenAcceptedVersion": null,
      "addIns": [],
      "allowPublicClient": null,
      "appId": "ff254847-12c7-44cf-921e-8883dbd622a7",
      "appRoles": [
        {
          "allowedMemberTypes": [
            "User"
          ],
          "description": "myAppRole",
          "displayName": "myAppRole",
          "id": "d212e66a-8927-469d-be76-f121e287ffb0",
          "isEnabled": true,
          "lang": null,
          "origin": "Application",
          "value": "123"
        }
      ],
      "oauth2AllowUrlPathMatching": false,
      "createdDateTime": "2022-02-07T08:51:18Z",
      "description": null,
      "certification": null,
      "disabledByMicrosoftStatus": null,
      "groupMembershipClaims": null,
      "identifierUris": [
        "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
      ],
      "informationalUrls": {
        "termsOfService": null,
        "support": null,
        "privacy": null,
        "marketing": null
      },
      "keyCredentials": [],
      "knownClientApplications": [],
      "logoUrl": null,
      "logoutUrl": null,
      "name": "My app",
      "notes": null,
      "oauth2AllowIdTokenImplicitFlow": false,
      "oauth2AllowImplicitFlow": false,
      "oauth2Permissions": [
        {
          "adminConsentDescription": "Access as a user",
          "adminConsentDisplayName": "Access as a user",
          "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
          "isEnabled": true,
          "lang": null,
          "origin": "Application",
          "type": "User",
          "userConsentDescription": null,
          "userConsentDisplayName": null,
          "value": "access_as_user"
        }
      ],
      "oauth2RequirePostResponse": false,
      "optionalClaims": null,
      "orgRestrictions": [],
      "parentalControlSettings": {
        "countriesBlockedForMinors": [],
        "legalAgeGroupRule": "Allow"
      },
      "passwordCredentials": [],
      "preAuthorizedApplications": [
        {
          "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
          "permissionIds": [
            "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
          ]
        },
        {
          "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
          "permissionIds": [
            "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
          ]
        }
      ],
      "publisherDomain": "contoso.onmicrosoft.com",
      "replyUrlsWithType": [
        {
          "url": "http://localhost/auth",
          "type": "Spa"
        },
        {
          "url": "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth",
          "type": "Spa"
        }
      ],
      "requiredResourceAccess": [
        {
          "resourceAppId": "00000003-0000-0000-c000-000000000000",
          "resourceAccess": [
            {
              "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
              "type": "Scope"
            },
            {
              "id": "62a82d76-70ea-41e2-9197-370581804d09",
              "type": "Role"
            },
            {
              "id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
              "type": "Role"
            }
          ]
        }
      ],
      "samlMetadataUrl": null,
      "serviceManagementReference": null,
      "signInUrl": null,
      "signInAudience": "AzureADMyOrg",
      "tags": [],
      "tokenEncryptionKeyId": null
    };

    (command as any).manifest = manifest;
    await command.action(logger, {
      options: {
        manifest: JSON.stringify(manifest),
        apisApplication: 'https://graph.microsoft.com/Group.ReadWrite.All,https://graph.microsoft.com/Directory.Read.All'
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: '19180b97-8f30-43ac-8a22-19565de0b064',
      objectId: 'bcac8603-cf65-479b-a4e5-8d45d3d05379',
      tenantId: ''
    }));
  });

  it(`creates Microsoft Entra app reg with just the name. Doesn't save the app info if not requested`, async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });
    const fsWriteFileSyncSpy = sinon.spy(fs, 'writeFileSync');

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app'
      }
    });
    assert(fsWriteFileSyncSpy.notCalled);
  });

  it(`saves app info in the .m365rc.json file in the current folder when requested. Creates the file it doesn't exist`, async () => {
    let fileContents: string | undefined;
    let filePath: string | undefined;
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(fs, 'existsSync').returns(false);
    sinon.stub(fs, 'writeFileSync').callsFake((_, contents) => {
      filePath = _.toString();
      fileContents = contents as string;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        save: true
      }
    });
    assert.strictEqual(filePath, '.m365rc.json');
    assert.strictEqual(fileContents, JSON.stringify({
      apps: [{
        appId: 'bc724b77-da87-43a9-b385-6ebaaf969db8',
        name: 'My Microsoft Entra app'
      }]
    }, null, 2));
  });

  it(`saves app info in the .m365rc.json file in the current folder when requested. Writes to the existing empty file`, async () => {
    let fileContents: string | undefined;
    let filePath: string | undefined;
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(fs, 'existsSync').returns(true);
    sinon.stub(fs, 'readFileSync').returns('');
    sinon.stub(fs, 'writeFileSync').callsFake((_, contents) => {
      filePath = _.toString();
      fileContents = contents as string;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        save: true
      }
    });
    assert.strictEqual(filePath, '.m365rc.json');
    assert.strictEqual(fileContents, JSON.stringify({
      apps: [{
        appId: 'bc724b77-da87-43a9-b385-6ebaaf969db8',
        name: 'My Microsoft Entra app'
      }]
    }, null, 2));
  });

  it(`saves app info in the .m365rc.json file in the current folder when requested. Adds to the existing file contents`, async () => {
    let fileContents: string | undefined;
    let filePath: string | undefined;
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(fs, 'existsSync').returns(true);
    sinon.stub(fs, 'readFileSync').returns(JSON.stringify({
      "apps": [
        {
          "appId": "74ad36da-3704-4e67-ba08-8c8e833f3c52",
          "name": "M365 app"
        }
      ]
    }));
    sinon.stub(fs, 'writeFileSync').callsFake((_, contents) => {
      filePath = _.toString();
      fileContents = contents as string;
    });

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        save: true
      }
    });
    assert.strictEqual(filePath, '.m365rc.json');
    assert.strictEqual(fileContents, JSON.stringify({
      apps: [
        {
          "appId": "74ad36da-3704-4e67-ba08-8c8e833f3c52",
          "name": "M365 app"
        },
        {
          appId: 'bc724b77-da87-43a9-b385-6ebaaf969db8',
          name: 'My Microsoft Entra app'
        }]
    }, null, 2));
  });

  it(`saves app info in the .m365rc.json file in the current folder when requested. Adds to the existing file contents (debug)`, async () => {
    let fileContents: string | undefined;
    let filePath: string | undefined;
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(fs, 'existsSync').returns(true);
    sinon.stub(fs, 'readFileSync').returns(JSON.stringify({
      "apps": [
        {
          "appId": "74ad36da-3704-4e67-ba08-8c8e833f3c52",
          "name": "M365 app"
        }
      ]
    }));
    sinon.stub(fs, 'writeFileSync').callsFake((_, contents) => {
      filePath = _.toString();
      fileContents = contents as string;
    });

    await command.action(logger, {
      options: {
        debug: true,
        name: 'My Microsoft Entra app',
        save: true
      }
    });
    assert.strictEqual(filePath, '.m365rc.json');
    assert.strictEqual(fileContents, JSON.stringify({
      apps: [
        {
          "appId": "74ad36da-3704-4e67-ba08-8c8e833f3c52",
          "name": "M365 app"
        },
        {
          appId: 'bc724b77-da87-43a9-b385-6ebaaf969db8',
          name: 'My Microsoft Entra app'
        }]
    }, null, 2));
  });

  it(`doesn't save app info in the .m365rc.json file when there was error reading file contents`, async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(fs, 'existsSync').returns(true);
    sinon.stub(fs, 'readFileSync').throws(new Error('An error has occurred'));
    const fsWriteFileSyncSpy = sinon.spy(fs, 'writeFileSync');

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        save: true
      }
    });
    assert(fsWriteFileSyncSpy.notCalled);
  });

  it(`doesn't save app info in the .m365rc.json file when file has invalid JSON`, async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(fs, 'existsSync').returns(true);
    sinon.stub(fs, 'readFileSync').returns('{');
    const fsWriteFileSyncSpy = sinon.spy(fs, 'writeFileSync');

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        save: true
      }
    });
    assert(fsWriteFileSyncSpy.notCalled);
  });

  it(`doesn't fail execution when error occurred while saving app info`, async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(fs, 'existsSync').returns(false);
    sinon.stub(fs, 'writeFileSync').throws(new Error('Error occurred while saving app info'));

    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        save: true
      }
    });
  });

  it('fails validation if specified platform value is not valid', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', platform: 'abc' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if platform value is spa', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', platform: 'spa', redirectUris: 'http://localhost:8080' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if platform value is web', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', platform: 'web', redirectUris: 'http://localhost:8080' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if platform value is publicClient', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', platform: 'publicClient', redirectUris: 'http://localhost:8080' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if redirectUris specified without platform', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', redirectUris: 'http://localhost:8080' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if redirectUris specified with platform', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', redirectUris: 'http://localhost:8080', platform: 'spa' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if platform is spa and redirectUris is not specified', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', platform: 'spa' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if platform is web and redirectUris is not specified', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', platform: 'web' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if platform is publicClient and redirectUris is not specified', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', platform: 'publicClient' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if scopeName specified without uri', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', scopeName: 'access_as_user', scopeAdminConsentDescription: 'Access as user', scopeAdminConsentDisplayName: 'Access as user' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if scopeName specified without scopeAdminConsentDescription', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', scopeName: 'access_as_user', uri: 'https://contoso.onmicrosoft.com/myapp', scopeAdminConsentDisplayName: 'Access as user' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if scopeName specified without scopeAdminConsentDisplayName', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', scopeName: 'access_as_user', uri: 'https://contoso.onmicrosoft.com/myapp', scopeAdminConsentDescription: 'Access as user' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if scopeName specified with uri, scopeAdminConsentDisplayName and scopeAdminConsentDescription', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', scopeName: 'access_as_user', uri: 'https://contoso.onmicrosoft.com/myapp', scopeAdminConsentDescription: 'Access as user', scopeAdminConsentDisplayName: 'Access as user' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if specified scopeConsentBy value is not valid', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', scopeConsentBy: 'abc' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if scopeConsentBy is admins', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', scopeConsentBy: 'admins' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if scopeConsentBy is adminsAndUsers', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', scopeConsentBy: 'adminsAndUsers' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if specified manifest is not a valid JSON string', async () => {
    const manifest = '{';
    const actual = await command.validate({ options: { manifest: manifest } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it(`fails validation if manifest is valid JSON but it doesn't contain name and name option not specified`, async () => {
    const manifest = '{}';
    const actual = await command.validate({ options: { manifest: manifest } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if certificateDisplayName is specified without certificate', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', certificateDisplayName: 'Some certificate' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both certificateBase64Encoded and certificateFile are specified', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', certificateFile: 'c:\\temp\\some-certificate.cer', certificateBase64Encoded: 'somebase64string' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if certificateFile specified with certificateDisplayName', async () => {
    sinon.stub(fs, 'existsSync').callsFake(_ => true);

    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', certificateDisplayName: 'Some certificate', certificateFile: 'c:\\temp\\some-certificate.cer' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation when certificate file is not found', async () => {
    sinon.stub(fs, 'existsSync').callsFake(_ => false);

    const actual = await command.validate({ options: { debug: true, name: 'My Microsoft Entra app', certificateDisplayName: 'some certificate', certificateFile: 'C:\\temp\\some-certificate.cer' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if certificateBase64Encoded specified with certificateDisplayName', async () => {
    const actual = await command.validate({ options: { name: 'My Microsoft Entra app', certificateDisplayName: 'Some certificate', certificateBase64Encoded: 'somebase64string' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if manifest is valid JSON', async () => {
    const manifest = '{"name": "My app"}';
    const actual = await command.validate({ options: { manifest: manifest } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('creates Microsoft Entra app reg for a web app from a manifest with redirectUris and options overriding them', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.microsoftGraphSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/bcac8603-cf65-479b-a4e5-8d45d3d05379') {
        if (JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime": "2022-02-07T08:51:18Z",
          "description": null,
          "certification": null,
          "groupMembershipClaims": null,
          "identifierUris": [
            "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
          ],
          "keyCredentials": [],
          "notes": null,
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ],
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": [
              {
                "adminConsentDescription": "Access as a user",
                "adminConsentDisplayName": "Access as a user",
                "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
                "isEnabled": true,
                "type": "User",
                "userConsentDescription": null,
                "userConsentDisplayName": null,
                "value": "access_as_user"
              }
            ]
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            },
            "redirectUris": [],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": [
              "http://localhost/auth",
              "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth"
            ]
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
          return;
        }

        if (JSON.stringify(opts.data) === JSON.stringify({
          "api": {
            "preAuthorizedApplications": [
              {
                "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              },
              {
                "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              }
            ]
          }
        })) {
          return;
        }
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ],
          "spa": {
            "redirectUris": [
              "http://localhost/auth",
              "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth"
            ]
          }
        })) {
        return {
          "id": "bcac8603-cf65-479b-a4e5-8d45d3d05379",
          "deletedDateTime": null,
          "appId": "19180b97-8f30-43ac-8a22-19565de0b064",
          "applicationTemplateId": null,
          "disabledByMicrosoftStatus": null,
          "createdDateTime": "2022-02-10T08:06:59.5299702Z",
          "displayName": "Angular Teams app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "publisherDomain": "M365x61791022.onmicrosoft.com",
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "defaultRedirectUri": null,
          "certification": null,
          "optionalClaims": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "62a82d76-70ea-41e2-9197-370581804d09",
                  "type": "Role"
                },
                {
                  "id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
                  "type": "Role"
                },
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ],
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          },
          "spa": {
            "redirectUris": []
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    (command as any).manifest = manifest;
    await command.action(logger, {
      options: {
        manifest: JSON.stringify(manifest),
        platform: "spa",
        redirectUris: "http://localhost/auth,https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth"
      }
    });

    assert(loggerLogSpy.calledWith({
      appId: '19180b97-8f30-43ac-8a22-19565de0b064',
      objectId: 'bcac8603-cf65-479b-a4e5-8d45d3d05379',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg for a web app from a manifest with app roles and specified Microsoft Graph application permissions overriding them', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId,appRoles,id,oauth2PermissionScopes,servicePrincipalNames') {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27",
          "value": [
            mocks.microsoftGraphSp
          ]
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/servicePrincipals?$select=appId%2cappRoles%2cid%2coauth2PermissionScopes%2cservicePrincipalNames&$skiptoken=X%274453707402000100000035536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D61323963386536336638613235536572766963655072696E636970616C5F34623131646566352D626561622D343232382D383835622D6132396338653633663861320000000000000000000000%27') {
        return {
          value: mocks.aadSp
        };
      }

      throw `Invalid GET request: ${opts.url}`;
    });
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/bcac8603-cf65-479b-a4e5-8d45d3d05379') {
        if (JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime": "2022-02-07T08:51:18Z",
          "description": null,
          "certification": null,
          "groupMembershipClaims": null,
          "identifierUris": [
            "api://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/ff254847-12c7-44cf-921e-8883dbd622a7"
          ],
          "keyCredentials": [],
          "notes": null,
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "62a82d76-70ea-41e2-9197-370581804d09",
                  "type": "Role"
                },
                {
                  "id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
                  "type": "Role"
                },
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ],
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": [
              {
                "adminConsentDescription": "Access as a user",
                "adminConsentDisplayName": "Access as a user",
                "id": "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5",
                "isEnabled": true,
                "type": "User",
                "userConsentDescription": null,
                "userConsentDisplayName": null,
                "value": "access_as_user"
              }
            ]
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            },
            "redirectUris": [],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": [
              "http://localhost/auth",
              "https://24c4-2001-1c00-80c-d00-e5da-977c-7c52-5197.ngrok.io/auth"
            ]
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
          return;
        }

        if (JSON.stringify(opts.data) === JSON.stringify({
          "api": {
            "preAuthorizedApplications": [
              {
                "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              },
              {
                "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
                "delegatedPermissionIds": [
                  "cf38eb5b-8fcd-4697-9bd5-d80b7f98dfc5"
                ]
              }
            ]
          }
        })) {
          return;
        }
      }

      throw `Invalid PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My app",
          "signInAudience": "AzureADMyOrg",
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "62a82d76-70ea-41e2-9197-370581804d09",
                  "type": "Role"
                },
                {
                  "id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
                  "type": "Role"
                }
              ]
            }
          ]
        })) {
        return {
          "id": "bcac8603-cf65-479b-a4e5-8d45d3d05379",
          "deletedDateTime": null,
          "appId": "19180b97-8f30-43ac-8a22-19565de0b064",
          "applicationTemplateId": null,
          "disabledByMicrosoftStatus": null,
          "createdDateTime": "2022-02-10T08:06:59.5299702Z",
          "displayName": "Angular Teams app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "publisherDomain": "M365x61791022.onmicrosoft.com",
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "defaultRedirectUri": null,
          "certification": null,
          "optionalClaims": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [
            {
              "resourceAppId": "00000003-0000-0000-c000-000000000000",
              "resourceAccess": [
                {
                  "id": "62a82d76-70ea-41e2-9197-370581804d09",
                  "type": "Role"
                },
                {
                  "id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
                  "type": "Role"
                },
                {
                  "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                  "type": "Scope"
                }
              ]
            }
          ],
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          },
          "spa": {
            "redirectUris": []
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    (command as any).manifest = manifest;
    await command.action(logger, {
      options: {
        manifest: JSON.stringify(manifest),
        apisApplication: 'https://graph.microsoft.com/Group.ReadWrite.All,https://graph.microsoft.com/Directory.Read.All'
      }
    });

    assert(loggerLogSpy.calledWith({
      appId: '19180b97-8f30-43ac-8a22-19565de0b064',
      objectId: 'bcac8603-cf65-479b-a4e5-8d45d3d05379',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg with a secret, overriding manifest', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/5b31c38c-2584-42f0-aa47-657fb3a84230' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime": "2022-02-07T08:51:18Z",
          "description": null,
          "certification": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "keyCredentials": [],
          "notes": null,
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "requiredResourceAccess": [],
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": []
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            },
            "redirectUris": [],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": []
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
        return;
      }

      throw `Issued PATCH request: ${JSON.stringify(opts, null, 2)}`;
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/5b31c38c-2584-42f0-aa47-657fb3a84230/addPassword') {
        return {
          "secretText": "VtJt.yG~V5pzbY2.xekx_0Xy_~9ozP_Ub5"
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    (command as any).manifest = manifestWithSecret;
    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        manifest: JSON.stringify(manifestWithSecret),
        withSecret: true
      }
    });

    assert(loggerLogSpy.calledWith({
      appId: 'bc724b77-da87-43a9-b385-6ebaaf969db8',
      objectId: '5b31c38c-2584-42f0-aa47-657fb3a84230',
      tenantId: '',
      secrets: [
        {
          displayName: 'mysecret',
          value: 'VtJt.yG~V5pzbY2.xekx_0Xy_~9ozP_Ub5'
        }
      ]
    }));
  });

  it('creates Microsoft Entra app reg with a certificate using base64 string, overriding manifest', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/5b31c38c-2584-42f0-aa47-657fb3a84230' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime":
            "2022-02-07T08:51:18Z",
          "description": null,
          "certification": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "notes": null,
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [],
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": []
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            },
            "redirectUris": [],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": []
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
        return;
      }

      throw 'Issued PATCH request';
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "keyCredentials": [{
            "type": "AsymmetricX509Cert",
            "usage": "Verify",
            "displayName": "some certificate",
            "key": "somecertificatebase64string"
          }]
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    (command as any).manifest = basicManifest;
    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        manifest: JSON.stringify(basicManifest),
        certificateDisplayName: 'some certificate',
        certificateBase64Encoded: 'somecertificatebase64string'
      }
    });

    assert(loggerLogSpy.calledWith({
      appId: 'bc724b77-da87-43a9-b385-6ebaaf969db8',
      objectId: '5b31c38c-2584-42f0-aa47-657fb3a84230',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg with a public client/redirectUris, overriding manifest', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/5b31c38c-2584-42f0-aa47-657fb3a84230' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime": "2022-02-07T08:51:18Z",
          "description": null,
          "certification": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "keyCredentials": [],
          "notes": null,
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [],
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": []
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            },
            "redirectUris": [],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": []
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
        return;
      }

      throw 'Issued PATCH request';
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg",
          "publicClient": {
            "redirectUris": ["https://login.microsoftonline.com/common/oauth2/nativeclient"]
          }
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    (command as any).manifest = basicManifest;
    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        manifest: JSON.stringify(basicManifest),
        platform: 'publicClient',
        redirectUris: 'https://login.microsoftonline.com/common/oauth2/nativeclient'
      }
    });

    assert(loggerLogSpy.calledWith({
      appId: 'bc724b77-da87-43a9-b385-6ebaaf969db8',
      objectId: '5b31c38c-2584-42f0-aa47-657fb3a84230',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg with implicit flow enabled, overriding manifest', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/5b31c38c-2584-42f0-aa47-657fb3a84230' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime": "2022-02-07T08:51:18Z",
          "description": null,
          "certification": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "keyCredentials": [],
          "notes": null,
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [],
          "serviceManagementReference": null,
          "signInAudience": "AzureADMultipleOrgs",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "oauth2PermissionScopes": []
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {},
            "redirectUris": [],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": []
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
        return;
      }

      throw 'Issued PATCH request';
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMultipleOrgs",
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": true,
              "enableIdTokenIssuance": true
            }
          }
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMultipleOrgs",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": true,
              "enableIdTokenIssuance": true
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    (command as any).manifest = basicManifest;
    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        manifest: JSON.stringify(basicManifest),
        implicitFlow: true,
        multitenant: true
      }
    });

    assert(loggerLogSpy.calledWith({
      appId: 'bc724b77-da87-43a9-b385-6ebaaf969db8',
      objectId: '5b31c38c-2584-42f0-aa47-657fb3a84230',
      tenantId: ''
    }));
  });

  it('creates Microsoft Entra app reg with a custom scope, overriding manifest', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/5b31c38c-2584-42f0-aa47-657fb3a84230' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "addIns": [],
          "appRoles": [],
          "createdDateTime": "2022-02-07T08:51:18Z",
          "description": null,
          "certification": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "keyCredentials": [],
          "notes": null,
          "optionalClaims": null,
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "requiredResourceAccess": [],
          "serviceManagementReference": null,
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": []
          },
          "info": {
            "termsOfServiceUrl": null,
            "supportUrl": null,
            "privacyStatementUrl": null,
            "marketingUrl": null,
            "logoUrl": null
          },
          "web": {
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            },
            "redirectUris": [],
            "logoutUrl": null,
            "homePageUrl": null
          },
          "spa": {
            "redirectUris": []
          },
          "isFallbackPublicClient": null,
          "displayName": "My app"
        })) {
        return;
      }
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/5b31c38c-2584-42f0-aa47-657fb3a84230') {
        const actualData = JSON.stringify(opts.data);
        const expectedData = JSON.stringify({
          "identifierUris": [
            "api://caf406b91cd4.ngrok.io/13e11551-2967-4985-8c55-cd2aaa6b80ad"
          ],
          "api": {
            "oauth2PermissionScopes": [
              {
                "adminConsentDescription": "Access as a user",
                "adminConsentDisplayName": "Access as a user",
                "id": "|",
                "type": "User",
                "value": "access_as_user"
              }
            ]
          }
        }).split('|');
        if (actualData.indexOf(expectedData[0]) > -1 && actualData.indexOf(expectedData[1]) > -1) {
          return;
        }
      }

      throw 'Issued PATCH request';
    });
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My Microsoft Entra app",
          "signInAudience": "AzureADMyOrg"
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "13e11551-2967-4985-8c55-cd2aaa6b80ad",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My Microsoft Entra app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": null,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    (command as any).manifest = basicManifest;
    await command.action(logger, {
      options: {
        name: 'My Microsoft Entra app',
        manifest: JSON.stringify(basicManifest),
        uri: 'api://caf406b91cd4.ngrok.io/_appId_',
        scopeName: 'access_as_user',
        scopeAdminConsentDescription: 'Access as a user',
        scopeAdminConsentDisplayName: 'Access as a user',
        scopeConsentBy: 'adminsAndUsers'
      }
    });

    assert(loggerLogSpy.calledWith({
      appId: '13e11551-2967-4985-8c55-cd2aaa6b80ad',
      objectId: '5b31c38c-2584-42f0-aa47-657fb3a84230',
      tenantId: ''
    }));
  });

  it('creates Entra app reg with defined name and allowPublicClientFlows option enabled', async () => {
    sinon.stub(request, 'get').rejects('Issues GET request');
    sinon.stub(request, 'patch').rejects('Issued PATCH request');
    sinon.stub(request, 'post').callsFake(async opts => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications' &&
        JSON.stringify(opts.data) === JSON.stringify({
          "displayName": "My AAD app",
          "signInAudience": "AzureADMyOrg",
          "isFallbackPublicClient": true
        })) {
        return {
          "id": "5b31c38c-2584-42f0-aa47-657fb3a84230",
          "deletedDateTime": null,
          "appId": "bc724b77-da87-43a9-b385-6ebaaf969db8",
          "applicationTemplateId": null,
          "createdDateTime": "2020-12-31T14:44:13.7945807Z",
          "displayName": "My AAD app",
          "description": null,
          "groupMembershipClaims": null,
          "identifierUris": [],
          "isDeviceOnlyAuthSupported": null,
          "isFallbackPublicClient": true,
          "notes": null,
          "optionalClaims": null,
          "publisherDomain": "contoso.onmicrosoft.com",
          "signInAudience": "AzureADMyOrg",
          "tags": [],
          "tokenEncryptionKeyId": null,
          "verifiedPublisher": {
            "displayName": null,
            "verifiedPublisherId": null,
            "addedDateTime": null
          },
          "spa": {
            "redirectUris": []
          },
          "defaultRedirectUri": null,
          "addIns": [],
          "api": {
            "acceptMappedClaims": null,
            "knownClientApplications": [],
            "requestedAccessTokenVersion": null,
            "oauth2PermissionScopes": [],
            "preAuthorizedApplications": []
          },
          "appRoles": [],
          "info": {
            "logoUrl": null,
            "marketingUrl": null,
            "privacyStatementUrl": null,
            "supportUrl": null,
            "termsOfServiceUrl": null
          },
          "keyCredentials": [],
          "parentalControlSettings": {
            "countriesBlockedForMinors": [],
            "legalAgeGroupRule": "Allow"
          },
          "passwordCredentials": [],
          "publicClient": {
            "redirectUris": []
          },
          "requiredResourceAccess": [],
          "web": {
            "homePageUrl": null,
            "logoutUrl": null,
            "redirectUris": [],
            "implicitGrantSettings": {
              "enableAccessTokenIssuance": false,
              "enableIdTokenIssuance": false
            }
          }
        };
      }

      throw `Invalid POST request: ${JSON.stringify(opts, null, 2)}`;
    });

    await command.action(logger, {
      options: {
        name: 'My AAD app',
        allowPublicClientFlows: true
      }
    });
    assert(loggerLogSpy.calledWith({
      appId: 'bc724b77-da87-43a9-b385-6ebaaf969db8',
      objectId: '5b31c38c-2584-42f0-aa47-657fb3a84230',
      tenantId: ''
    }));
  });
});

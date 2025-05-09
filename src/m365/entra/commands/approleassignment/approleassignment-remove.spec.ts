import assert from 'assert';
import os from 'os';
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
import command from './approleassignment-remove.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.APPROLEASSIGNMENT_REMOVE, () => {
  let log: string[];
  let logger: Logger;
  let commandInfo: CommandInfo;
  let promptIssued: boolean = false;
  let deleteRequestStub: sinon.SinonStub;

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
    sinon.stub(cli, 'promptForConfirmation').callsFake(() => {
      promptIssued = true;
      return Promise.resolve(false);
    });
    promptIssued = false;
    sinon.stub(request, 'get').callsFake(async (opts: any) => {
      if ((opts.url as string).indexOf(`/v1.0/servicePrincipals?`) > -1) {
        // fake first call for getting service principal
        if (opts.url.indexOf('startswith') === -1) {
          return { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#servicePrincipals(appRoleAssignments())", "value": [{ "id": "3e64c22f-3f14-4bce-a267-cb44c9a08e17", "deletedDateTime": null, "accountEnabled": true, "alternativeNames": [], "appDisplayName": "myapp", "appDescription": null, "appId": "dc311e81-e099-4c64-bd66-c7183465f3f2", "applicationTemplateId": null, "appOwnerOrganizationId": "c8e571e1-d528-43d9-8776-dc51157d615a", "appRoleAssignmentRequired": false, "createdDateTime": "2020-04-21T06:50:56Z", "description": null, "displayName": "myapp", "homepage": null, "loginUrl": null, "logoutUrl": null, "notes": null, "notificationEmailAddresses": [], "preferredSingleSignOnMode": null, "preferredTokenSigningKeyThumbprint": null, "replyUrls": [], "resourceSpecificApplicationPermissions": [], "samlSingleSignOnSettings": null, "servicePrincipalNames": ["dc311e81-e099-4c64-bd66-c7183465f3f2"], "servicePrincipalType": "Application", "signInAudience": "AzureADandPersonalMicrosoftAccount", "tags": ["WindowsAzureActiveDirectoryIntegratedApp"], "tokenEncryptionKeyId": null, "verifiedPublisher": { "displayName": null, "verifiedPublisherId": null, "addedDateTime": null }, "addIns": [], "appRoles": [], "info": { "logoUrl": null, "marketingUrl": null, "privacyStatementUrl": null, "supportUrl": null, "termsOfServiceUrl": null }, "keyCredentials": [], "oauth2PermissionScopes": [], "passwordCredentials": [], "appRoleAssignments@odata.context": "https://graph.microsoft.com/v1.0/$metadata#servicePrincipals('3e64c22f-3f14-4bce-a267-cb44c9a08e17')/appRoleAssignments", "appRoleAssignments": [{ "id": "L8JkPhQ_zkuiZ8tEyaCOF8xDeJC6Z09PiQhDnXpNuYI", "deletedDateTime": null, "appRoleId": "d13f72ca-a275-4b96-b789-48ebcc4da984", "createdDateTime": "2020-10-25T12:04:13.6550724Z", "principalDisplayName": "myapp", "principalId": "3e64c22f-3f14-4bce-a267-cb44c9a08e17", "principalType": "ServicePrincipal", "resourceDisplayName": "Office 365 SharePoint Online", "resourceId": "df3d00f0-a24d-45a9-ba8b-3b0934ec3a6c" }, { "id": "L8JkPhQ_zkuiZ8tEyaCOFxSPOO7XQmlKmMHk580MMAg", "deletedDateTime": null, "appRoleId": "678536fe-1083-478a-9c59-b99265e6b0d3", "createdDateTime": "2020-10-17T15:08:29.6907782Z", "principalDisplayName": "myapp", "principalId": "3e64c22f-3f14-4bce-a267-cb44c9a08e17", "principalType": "ServicePrincipal", "resourceDisplayName": "Office 365 SharePoint Online", "resourceId": "df3d00f0-a24d-45a9-ba8b-3b0934ec3a6c" }] }] };
        }
        // second get request for searching for service principals by resource options value specified
        return { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#servicePrincipals", "value": [{ "id": "df3d00f0-a24d-45a9-ba8b-3b0934ec3a6c", "deletedDateTime": null, "accountEnabled": true, "alternativeNames": [], "appDisplayName": "Office 365 SharePoint Online", "appDescription": null, "appId": "00000003-0000-0ff1-ce00-000000000000", "applicationTemplateId": null, "appOwnerOrganizationId": "f8cdef31-a31e-4b4a-93e4-5f571e91255a", "appRoleAssignmentRequired": false, "createdDateTime": "2019-01-11T07:34:21Z", "description": null, "displayName": "Office 365 SharePoint Online", "homepage": null, "loginUrl": null, "logoutUrl": "https://signout.sharepoint.com/_layouts/15/expirecookies.aspx", "notes": null, "notificationEmailAddresses": [], "preferredSingleSignOnMode": null, "preferredTokenSigningKeyThumbprint": null, "replyUrls": ["https://www180015.066dapp.com/_layouts/15/spolanding.aspx", "https://www167017.080dapp.com/_layouts/15/spolanding.aspx", "https://www174015.019dapp.com/_layouts/15/spolanding.aspx", "https://www162015.079dapp.com/_layouts/15/spolanding.aspx", "https://www156015.077dapp.com/_layouts/15/spolanding.aspx", "https://www158015.075dapp.com/_layouts/15/spolanding.aspx", "https://www145007.074dapp.com/_layouts/15/spolanding.aspx", "https://www148015.030dapp.com/_layouts/15/spolanding.aspx", "https://www141017.028dapp.com/_layouts/15/spolanding.aspx", "https://www143020.025dapp.com/_layouts/15/spolanding.aspx", "https://www138015.076dapp.com/_layouts/15/spolanding.aspx", "https://www136028.062dapp.com/_layouts/15/spolanding.aspx", "https://www129017.072dapp.com/_layouts/15/spolanding.aspx", "https://www127017.005dapp.com/_layouts/15/spolanding.aspx", "https://www124016.032dapp.com/_layouts/15/spolanding.aspx", "https://www117017.063dapp.com/_layouts/15/spolanding.aspx", "https://www115014.071dapp.com/_layouts/15/spolanding.aspx", "https://www111031.045dapp.com/_layouts/15/spolanding.aspx", "https://www113025.044dapp.com/_layouts/15/spolanding.aspx", "https://www105021.059dapp.com/_layouts/15/spolanding.aspx", "https://www92050.065dapp.com/_layouts/15/spolanding.aspx", "https://www32058.050dapp.com/_layouts/15/spolanding.aspx", "https://www29079.048dapp.com/_layouts/15/spolanding.aspx", "https://www39085.034dapp.com/_layouts/15/spolanding.aspx", "https://www38024.068dapp.com/_layouts/15/spolanding.aspx", "https://www37045.007dapp.com/_layouts/15/spolanding.aspx", "https://www30090.054dapp.com/_layouts/15/spolanding.aspx", "https://www95027.027dapp.com/_layouts/15/spolanding.aspx", "https://www75007.023dapp.com/_layouts/15/spolanding.aspx", "https://www70030.035dapp.com/_layouts/15/spolanding.aspx", "https://www60140.098dspoapp.com/_layouts/15/spolanding.aspx", "https://www160015.078dapp.com/_layouts/15/spolanding.aspx", "https://www154017.003dapp.com/_layouts/15/spolanding.aspx", "https://www102027.067dapp.com/_layouts/15/spolanding.aspx", "https://www100039.017dapp.com/_layouts/15/spolanding.aspx", "https://www87072.042dapp.com/_layouts/15/spolanding.aspx", "https://www90082.053dapp.com/_layouts/15/spolanding.aspx", "https://www80033.011dapp.com/_layouts/15/spolanding.aspx", "https://www65158.013dspoapp.com/_layouts/15/spolanding.aspx", "https://www139017.073dapp.com/_layouts/15/spolanding.aspx", "https://www133018.046dapp.com/_layouts/15/spolanding.aspx", "https://www97058.085dspoapp.com/_layouts/15/spolanding.aspx"], "resourceSpecificApplicationPermissions": [], "samlSingleSignOnSettings": null, "servicePrincipalNames": ["00000003-0000-0ff1-ce00-000000000000/*.sharepoint.com", "00000003-0000-0ff1-ce00-000000000000", "https://microsoft.sharepoint-df.com"], "servicePrincipalType": "Application", "signInAudience": "AzureADMultipleOrgs", "tags": [], "tokenEncryptionKeyId": null, "verifiedPublisher": { "displayName": null, "verifiedPublisherId": null, "addedDateTime": null }, "addIns": [], "appRoles": [{ "allowedMemberTypes": ["Application"], "description": "Allows the app to create, read, update, and delete documents and list items in all site collections without a signed in user.", "displayName": "Read and write items in all site collections", "id": "fbcd29d2-fcca-4405-aded-518d457caae4", "isEnabled": true, "origin": "Application", "value": "Sites.ReadWrite.All" }, { "allowedMemberTypes": ["Application"], "description": "Allows the app to read documents and list items in all site collections without a signed in user.", "displayName": "Read items in all site collections", "id": "d13f72ca-a275-4b96-b789-48ebcc4da984", "isEnabled": true, "origin": "Application", "value": "Sites.Read.All" }, { "allowedMemberTypes": ["Application"], "description": "Allows the app to have full control of all site collections without a signed in user.", "displayName": "Have full control of all site collections", "id": "678536fe-1083-478a-9c59-b99265e6b0d3", "isEnabled": true, "origin": "Application", "value": "Sites.FullControl.All" }, { "allowedMemberTypes": ["Application"], "description": "Allows the app to read, create, update, and delete document libraries and lists in all site collections without a signed in user.", "displayName": "Read and write items and lists in all site collections", "id": "9bff6588-13f2-4c48-bbf2-ddab62256b36", "isEnabled": true, "origin": "Application", "value": "Sites.Manage.All" }, { "allowedMemberTypes": ["Application"], "description": "Allows the app to read enterprise managed metadata and to read basic site info without a signed in user.", "displayName": "Read managed metadata", "id": "2a8d57a5-4090-4a41-bf1c-3c621d2ccad3", "isEnabled": true, "origin": "Application", "value": "TermStore.Read.All" }, { "allowedMemberTypes": ["Application"], "description": "Allows the app to write enterprise managed metadata and to read basic site info without a signed in user.", "displayName": "Read and write managed metadata", "id": "c8e3537c-ec53-43b9-bed3-b2bd3617ae97", "isEnabled": true, "origin": "Application", "value": "TermStore.ReadWrite.All" }, { "allowedMemberTypes": ["Application"], "description": "Allows the app to read and update user profiles and to read basic site info without a signed in user.", "displayName": "Read and write user profiles", "id": "741f803b-c850-494e-b5df-cde7c675a1ca", "isEnabled": true, "origin": "Application", "value": "User.ReadWrite.All" }, { "allowedMemberTypes": ["Application"], "description": "Allows the app to read user profiles without a signed in user.", "displayName": "Read user profiles", "id": "df021288-bdef-4463-88db-98f22de89214", "isEnabled": true, "origin": "Application", "value": "User.Read.All" }], "info": { "logoUrl": null, "marketingUrl": null, "privacyStatementUrl": null, "supportUrl": null, "termsOfServiceUrl": null }, "keyCredentials": [], "oauth2PermissionScopes": [{ "adminConsentDescription": "Allows the app to read all OData reporting data from all ProjectWebApp site collections for the signed-in user.", "adminConsentDisplayName": "Read ProjectWebApp OData reporting data", "id": "a4c14cd7-8bd6-4337-8e87-78623dfc023b", "isEnabled": true, "type": "User", "userConsentDescription": "Allows the app to read all OData reporting data from all ProjectWebApp site collections for the signed-in user.", "userConsentDisplayName": "Read ProjectWebApp OData reporting data", "value": "ProjectWebAppReporting.Read" }, { "adminConsentDescription": "Allows the app to submit project task status updates the signed-in user.", "adminConsentDisplayName": "Submit project task status updates", "id": "c4258712-0efb-41f1-b6bc-be58e4e32f3f", "isEnabled": true, "type": "User", "userConsentDescription": "Allows the app to submit project task status updates the signed-in user.", "userConsentDisplayName": "Submit project task status updates", "value": "TaskStatus.Submit" }, { "adminConsentDescription": "Allows the app to read, create, update, and delete the current user’s enterprise resources.", "adminConsentDisplayName": "Read and write user project enterprise resources", "id": "2511a087-5795-4cae-9123-d5b7d6ec4844", "isEnabled": true, "type": "User", "userConsentDescription": "Allows the app to read, create, update, and delete the current user’s enterprise resources.", "userConsentDisplayName": "Read and write user project enterprise resources", "value": "EnterpriseResource.Write" }, { "adminConsentDescription": "Allows the app to read the current user's enterprise resources.", "adminConsentDisplayName": "Read user project enterprise resources", "id": "b8341dab-4143-49da-8eb9-3d8c073f9e77", "isEnabled": true, "type": "User", "userConsentDescription": "Allows the app to read the current user's enterprise resources.", "userConsentDisplayName": "Read user project enterprise resources", "value": "EnterpriseResource.Read" }, { "adminConsentDescription": "Allows the app to read, create, update, and delete the current users’ projects.", "adminConsentDisplayName": "Read and write user projects", "id": "d75a7b17-f04e-40d9-8e35-79b949bdb891", "isEnabled": true, "type": "User", "userConsentDescription": "Allows the app to read, create, update, and delete the current users’ projects.", "userConsentDisplayName": "Read and write user projects", "value": "Project.Write" }, { "adminConsentDescription": "Allows the app to read the current user's projects.", "adminConsentDisplayName": "Read user projects", "id": "2beb830c-70d1-4f5b-a983-79cbdb0c6c6a", "isEnabled": true, "type": "User", "userConsentDescription": "Allows the app to read the current user's projects.", "userConsentDisplayName": "Read user projects", "value": "Project.Read" }, { "adminConsentDescription": "Allows the app to have full control of all ProjectWebApp site collections the signed-in user.", "adminConsentDisplayName": "Have full control of all ProjectWebApp site collections", "id": "e7e732bd-932b-45c4-8ce5-40d60a7daad9", "isEnabled": true, "type": "Admin", "userConsentDescription": "Allows the app to have full control of all ProjectWebApp site collections the signed-in user.", "userConsentDisplayName": "Have full control of all ProjectWebApp site collections", "value": "ProjectWebApp.FullControl" }, { "adminConsentDescription": "Allows the app to read managed metadata and to read basic site info on behalf of the signed-in user.", "adminConsentDisplayName": "Read managed metadata", "id": "a468ea40-458c-4cc2-80c4-51781af71e41", "isEnabled": true, "type": "Admin", "userConsentDescription": "Allows the app to read managed metadata and to read basic site info on your behalf.", "userConsentDisplayName": "Read managed metadata", "value": "TermStore.Read.All" }, { "adminConsentDescription": "Allows the app to read, create, update, and delete managed metadata and to read basic site info on behalf of the signed-in user.", "adminConsentDisplayName": "Read and write managed metadata", "id": "59a198b5-0420-45a8-ae59-6da1cb640505", "isEnabled": true, "type": "Admin", "userConsentDescription": "Allows the app to read, create, update, and delete managed metadata and to read basic site info on your behalf.", "userConsentDisplayName": "Read and write managed metadata", "value": "TermStore.ReadWrite.All" }, { "adminConsentDescription": "Allows the app to run search queries and to read basic site info on behalf of the current signed-in user. Search results are based on the user's permissions instead of the app's permissions.", "adminConsentDisplayName": "Run search queries as a user", "id": "1002502a-9a71-4426-8551-69ab83452fab", "isEnabled": true, "type": "Admin", "userConsentDescription": "Allows the app to run search queries and to read basic site info on your behalf. Search results are based on your permissions.", "userConsentDisplayName": "Run search queries ", "value": "Sites.Search.All" }, { "adminConsentDescription": "Allows the app to read documents and list items in all site collections on behalf of the signed-in user.", "adminConsentDisplayName": "Read items in all site collections", "id": "4e0d77b0-96ba-4398-af14-3baa780278f4", "isEnabled": true, "type": "User", "userConsentDescription": "Allows the app to read documents and list items in all site collections on your behalf.", "userConsentDisplayName": "Read items in all site collections", "value": "AllSites.Read" }, { "adminConsentDescription": "Allows the app to create, read, update, and delete documents and list items in all site collections on behalf of the signed-in user.", "adminConsentDisplayName": "Read and write items in all site collections", "id": "640ddd16-e5b7-4d71-9690-3f4022699ee7", "isEnabled": true, "type": "User", "userConsentDescription": "Allows the app to create, read, update, and delete documents and list items in all site collections on your behalf.", "userConsentDisplayName": "Read and write items in all site collections", "value": "AllSites.Write" }, { "adminConsentDescription": "Allows the app to read, create, update, and delete document libraries and lists in all site collections on behalf of the signed-in user.", "adminConsentDisplayName": "Read and write items and lists in all site collections", "id": "b3f70a70-8a4b-4f95-9573-d71c496a53f4", "isEnabled": true, "type": "User", "userConsentDescription": "Allows the app to read, create, update, and delete document libraries and lists in all site collections on your behalf.", "userConsentDisplayName": "Read and write items and lists in all site collections", "value": "AllSites.Manage" }, { "adminConsentDescription": "Allows the app to have full control of all site collections on behalf of the signed-in user.", "adminConsentDisplayName": "Have full control of all site collections", "id": "56680e0d-d2a3-4ae1-80d8-3c4f2100e3d0", "isEnabled": true, "type": "Admin", "userConsentDescription": "Allows the app to have full control of all site collections on your behalf.", "userConsentDisplayName": "Have full control of all site collections", "value": "AllSites.FullControl" }, { "adminConsentDescription": "Allows the app to read the current user's files.", "adminConsentDisplayName": "Read user files", "id": "dd2c8d78-58e1-46d7-82dd-34d411282686", "isEnabled": true, "type": "User", "userConsentDescription": "Allows the app to read your files.", "userConsentDisplayName": "Read your files", "value": "MyFiles.Read" }, { "adminConsentDescription": "Allows the app to read, create, update, and delete the current user's files.", "adminConsentDisplayName": "Read and write user files", "id": "2cfdc887-d7b4-4798-9b33-3d98d6b95dd2", "isEnabled": true, "type": "User", "userConsentDescription": "Allows the app to read, create, update, and delete your files.", "userConsentDisplayName": "Read and write your files", "value": "MyFiles.Write" }, { "adminConsentDescription": "Allows the app to read and update user profiles and to read basic site info on behalf of the signed-in user.", "adminConsentDisplayName": "Read and write user profiles", "id": "82866913-39a9-4be7-8091-f4fa781088ae", "isEnabled": true, "type": "Admin", "userConsentDescription": "Allows the app to read and update user profiles and to read basic site info on your behalf.", "userConsentDisplayName": "Read and write user profiles", "value": "User.ReadWrite.All" }, { "adminConsentDescription": "Allows the app to read user profiles and to read basic site info on behalf of the signed-in user.", "adminConsentDisplayName": "Read user profiles", "id": "0cea5a30-f6f8-42b5-87a0-84cc26822e02", "isEnabled": true, "type": "Admin", "userConsentDescription": "Allows the app to read user profiles and basic site info on your behalf.", "userConsentDisplayName": "Read user profiles", "value": "User.Read.All" }], "passwordCredentials": [] }] };
      }
      throw 'Invalid request';
    });
    deleteRequestStub = sinon.stub(request, 'delete').callsFake(async (opts: any) => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/servicePrincipals/3e64c22f-3f14-4bce-a267-cb44c9a08e17/appRoleAssignments/L8JkPhQ_zkuiZ8tEyaCOF8xDeJC6Z09PiQhDnXpNuYI' ||
        opts.url === 'https://graph.microsoft.com/v1.0/servicePrincipals/3e64c22f-3f14-4bce-a267-cb44c9a08e17/appRoleAssignments/L8JkPhQ_zkuiZ8tEyaCOFxSPOO7XQmlKmMHk580MMAg') {
        return;
      }
      throw 'Invalid request';
    });
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get,
      request.delete,
      cli.promptForConfirmation,
      cli.getSettingWithDefaultValue
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.APPROLEASSIGNMENT_REMOVE);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('prompts before removing the app role assignment when force option not passed', async () => {
    await command.action(logger, { options: { appId: 'dc311e81-e099-4c64-bd66-c7183465f3f2', resource: 'SharePoint', scopes: 'Sites.Read.All' } });

    assert(promptIssued);
  });

  it('prompts before removing the app role assignment when force option not passed (debug)', async () => {
    await command.action(logger, { options: { debug: true, appId: 'dc311e81-e099-4c64-bd66-c7183465f3f2', resource: 'SharePoint', scopes: 'Sites.Read.All' } });

    assert(promptIssued);
  });

  it('aborts removing the app role assignment when prompt not confirmed', async () => {
    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(false);

    await command.action(logger, { options: { appDisplayName: 'myapp', resource: 'SharePoint', scopes: 'Sites.Read.All' } });
    assert(deleteRequestStub.notCalled);
  });

  it('deletes app role assignment when prompt confirmed (debug)', async () => {
    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await command.action(logger, { options: { debug: true, appDisplayName: 'myapp', resource: 'SharePoint', scopes: 'Sites.Read.All' } });
    assert(deleteRequestStub.called);
  });

  it('deletes app role assignments for service principal with specified displayName', async () => {
    await command.action(logger, { options: { appDisplayName: 'myapp', resource: 'SharePoint', scopes: 'Sites.Read.All', force: true } });
    assert(deleteRequestStub.called);
  });

  it('deletes app role assignments for service principal with specified objectId and multiple scopes', async () => {
    await command.action(logger, { options: { appObjectId: '3e64c22f-3f14-4bce-a267-cb44c9a08e17', resource: 'SharePoint', scopes: 'Sites.Read.All,Sites.FullControl.All', force: true } });
    assert(deleteRequestStub.calledTwice);
  });

  it('deletes app role assignments for service principal with specified appId (debug)', async () => {
    await command.action(logger, { options: { debug: true, appId: 'dc311e81-e099-4c64-bd66-c7183465f3f2', resource: 'SharePoint', scopes: 'Sites.Read.All', force: true } });
    assert(deleteRequestStub.called);
  });

  it('handles intune alias for the resource option value', async () => {
    await command.action(logger, { options: { debug: true, appId: 'dc311e81-e099-4c64-bd66-c7183465f3f2', resource: 'intune', scopes: 'Sites.Read.All', force: true } });
    assert(deleteRequestStub.called);
  });

  it('handles exchange alias for the resource option value', async () => {
    await command.action(logger, { options: { debug: true, appId: 'dc311e81-e099-4c64-bd66-c7183465f3f2', resource: 'exchange', scopes: 'Sites.Read.All', force: true } });
    assert(deleteRequestStub.called);
  });

  it('handles appId for the resource option value', async () => {
    await command.action(logger, { options: { debug: true, appId: 'dc311e81-e099-4c64-bd66-c7183465f3f2', resource: 'fff194f1-7dce-4428-8301-1badb5518201', scopes: 'Sites.Read.All', force: true } });
    assert(deleteRequestStub.called);
  });

  it('rejects if no resource is found', async () => {
    sinonUtil.restore(request.get);
    sinon.stub(request, 'get').callsFake(async (opts: any): Promise<any> => {
      if ((opts.url as string).indexOf(`/v1.0/servicePrincipals?`) > -1) {
        // fake first call for getting service principal
        if (opts.url.indexOf('startswith') === -1) {
          return { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#servicePrincipals(appRoleAssignments())", "value": [{ "id": "3e64c22f-3f14-4bce-a267-cb44c9a08e17", "deletedDateTime": null, "accountEnabled": true, "alternativeNames": [], "appDisplayName": "myapp", "appDescription": null, "appId": "dc311e81-e099-4c64-bd66-c7183465f3f2", "applicationTemplateId": null, "appOwnerOrganizationId": "c8e571e1-d528-43d9-8776-dc51157d615a", "appRoleAssignmentRequired": false, "createdDateTime": "2020-04-21T06:50:56Z", "description": null, "displayName": "myapp", "homepage": null, "loginUrl": null, "logoutUrl": null, "notes": null, "notificationEmailAddresses": [], "preferredSingleSignOnMode": null, "preferredTokenSigningKeyThumbprint": null, "replyUrls": [], "resourceSpecificApplicationPermissions": [], "samlSingleSignOnSettings": null, "servicePrincipalNames": ["dc311e81-e099-4c64-bd66-c7183465f3f2"], "servicePrincipalType": "Application", "signInAudience": "AzureADandPersonalMicrosoftAccount", "tags": ["WindowsAzureActiveDirectoryIntegratedApp"], "tokenEncryptionKeyId": null, "verifiedPublisher": { "displayName": null, "verifiedPublisherId": null, "addedDateTime": null }, "addIns": [], "appRoles": [], "info": { "logoUrl": null, "marketingUrl": null, "privacyStatementUrl": null, "supportUrl": null, "termsOfServiceUrl": null }, "keyCredentials": [], "oauth2PermissionScopes": [], "passwordCredentials": [], "appRoleAssignments@odata.context": "https://graph.microsoft.com/v1.0/$metadata#servicePrincipals('3e64c22f-3f14-4bce-a267-cb44c9a08e17')/appRoleAssignments", "appRoleAssignments": [{ "id": "L8JkPhQ_zkuiZ8tEyaCOF8xDeJC6Z09PiQhDnXpNuYI", "deletedDateTime": null, "appRoleId": "d13f72ca-a275-4b96-b789-48ebcc4da984", "createdDateTime": "2020-10-25T12:04:13.6550724Z", "principalDisplayName": "myapp", "principalId": "3e64c22f-3f14-4bce-a267-cb44c9a08e17", "principalType": "ServicePrincipal", "resourceDisplayName": "Office 365 SharePoint Online", "resourceId": "df3d00f0-a24d-45a9-ba8b-3b0934ec3a6c" }, { "id": "L8JkPhQ_zkuiZ8tEyaCOFxSPOO7XQmlKmMHk580MMAg", "deletedDateTime": null, "appRoleId": "678536fe-1083-478a-9c59-b99265e6b0d3", "createdDateTime": "2020-10-17T15:08:29.6907782Z", "principalDisplayName": "myapp", "principalId": "3e64c22f-3f14-4bce-a267-cb44c9a08e17", "principalType": "ServicePrincipal", "resourceDisplayName": "Office 365 SharePoint Online", "resourceId": "df3d00f0-a24d-45a9-ba8b-3b0934ec3a6c" }] }] };
        }
        // second get request for searching for service principals by resource options value specified
        return { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#servicePrincipals", "value": [] };
      }
      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { debug: true, appId: '3e64c22f-3f14-4bce-a267-cb44c9a08e17', resource: 'SharePoint', scopes: 'Sites.Read.All', force: true } } as any),
      new CommandError(`Resource not found`));
  });

  it('rejects if no app roles found for the specified resource', async () => {
    sinonUtil.restore(request.get);
    sinon.stub(request, 'get').callsFake(async (opts: any): Promise<any> => {
      if ((opts.url as string).indexOf(`/v1.0/servicePrincipals?`) > -1) {
        // fake first call for getting service principal
        if (opts.url.indexOf('startswith') === -1) {
          return { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#servicePrincipals(appRoleAssignments())", "value": [{ "id": "3e64c22f-3f14-4bce-a267-cb44c9a08e17", "deletedDateTime": null, "accountEnabled": true, "alternativeNames": [], "appDisplayName": "myapp", "appDescription": null, "appId": "dc311e81-e099-4c64-bd66-c7183465f3f2", "applicationTemplateId": null, "appOwnerOrganizationId": "c8e571e1-d528-43d9-8776-dc51157d615a", "appRoleAssignmentRequired": false, "createdDateTime": "2020-04-21T06:50:56Z", "description": null, "displayName": "myapp", "homepage": null, "loginUrl": null, "logoutUrl": null, "notes": null, "notificationEmailAddresses": [], "preferredSingleSignOnMode": null, "preferredTokenSigningKeyThumbprint": null, "replyUrls": [], "resourceSpecificApplicationPermissions": [], "samlSingleSignOnSettings": null, "servicePrincipalNames": ["dc311e81-e099-4c64-bd66-c7183465f3f2"], "servicePrincipalType": "Application", "signInAudience": "AzureADandPersonalMicrosoftAccount", "tags": ["WindowsAzureActiveDirectoryIntegratedApp"], "tokenEncryptionKeyId": null, "verifiedPublisher": { "displayName": null, "verifiedPublisherId": null, "addedDateTime": null }, "addIns": [], "appRoles": [], "info": { "logoUrl": null, "marketingUrl": null, "privacyStatementUrl": null, "supportUrl": null, "termsOfServiceUrl": null }, "keyCredentials": [], "oauth2PermissionScopes": [], "passwordCredentials": [], "appRoleAssignments@odata.context": "https://graph.microsoft.com/v1.0/$metadata#servicePrincipals('3e64c22f-3f14-4bce-a267-cb44c9a08e17')/appRoleAssignments", "appRoleAssignments": [{ "id": "L8JkPhQ_zkuiZ8tEyaCOF8xDeJC6Z09PiQhDnXpNuYI", "deletedDateTime": null, "appRoleId": "d13f72ca-a275-4b96-b789-48ebcc4da984", "createdDateTime": "2020-10-25T12:04:13.6550724Z", "principalDisplayName": "myapp", "principalId": "3e64c22f-3f14-4bce-a267-cb44c9a08e17", "principalType": "ServicePrincipal", "resourceDisplayName": "Office 365 SharePoint Online", "resourceId": "df3d00f0-a24d-45a9-ba8b-3b0934ec3a6c" }, { "id": "L8JkPhQ_zkuiZ8tEyaCOFxSPOO7XQmlKmMHk580MMAg", "deletedDateTime": null, "appRoleId": "678536fe-1083-478a-9c59-b99265e6b0d3", "createdDateTime": "2020-10-17T15:08:29.6907782Z", "principalDisplayName": "myapp", "principalId": "3e64c22f-3f14-4bce-a267-cb44c9a08e17", "principalType": "ServicePrincipal", "resourceDisplayName": "Office 365 SharePoint Online", "resourceId": "df3d00f0-a24d-45a9-ba8b-3b0934ec3a6c" }] }] };
        }
        // second get request for searching for service principals by resource options value specified
        return { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#servicePrincipals", "value": [{ "id": "df3d00f0-a24d-45a9-ba8b-3b0934ec3a6c", "appRoles": [] }] };
      }
      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { debug: true, appId: '3e64c22f-3f14-4bce-a267-cb44c9a08e17', resource: 'SharePoint', scopes: 'Sites.Read.All', force: true } } as any),
      new CommandError(`The resource 'SharePoint' does not have any application permissions available.`));
  });

  it('rejects if no app roles found for the specified resource option value', async () => {
    sinonUtil.restore(request.get);
    sinon.stub(request, 'get').callsFake(async (opts: any): Promise<any> => {
      if ((opts.url as string).indexOf(`/v1.0/servicePrincipals?`) > -1) {
        // fake first call for getting service principal
        if (opts.url.indexOf('startswith') === -1) {
          return { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#servicePrincipals", "value": [{ "id": "3e64c22f-3f14-4bce-a267-cb44c9a08e17", "deletedDateTime": null, "accountEnabled": true, "alternativeNames": [], "appDisplayName": "myapp", "appDescription": null, "appId": "dc311e81-e099-4c64-bd66-c7183465f3f2", "applicationTemplateId": null, "appOwnerOrganizationId": "c8e571e1-d528-43d9-8776-dc51157d615a", "appRoleAssignmentRequired": false, "createdDateTime": "2020-08-29T18:35:13Z", "description": null, "displayName": "myapp", "homepage": null, "loginUrl": null, "logoutUrl": null, "notes": null, "notificationEmailAddresses": [], "preferredSingleSignOnMode": null, "preferredTokenSigningKeyThumbprint": null, "replyUrls": ["https://login.microsoftonline.com/common/oauth2/nativeclient"], "resourceSpecificApplicationPermissions": [], "samlSingleSignOnSettings": null, "servicePrincipalNames": ["dc311e81-e099-4c64-bd66-c7183465f3f2"], "servicePrincipalType": "Application", "signInAudience": "AzureADMyOrg", "tags": ["WindowsAzureActiveDirectoryIntegratedApp"], "tokenEncryptionKeyId": null, "verifiedPublisher": { "displayName": null, "verifiedPublisherId": null, "addedDateTime": null }, "addIns": [], "appRoles": [], "info": { "logoUrl": null, "marketingUrl": null, "privacyStatementUrl": null, "supportUrl": null, "termsOfServiceUrl": null }, "keyCredentials": [], "oauth2PermissionScopes": [], "passwordCredentials": [] }] };
        }
        // second get request for searching for service principals by resource options value specified
        return { "value": [{ id: "5edf62fd-ae7a-4a99-af2e-fc5950aaed07", "appRoles": [{ value: 'Scope1', id: '1' }, { value: 'Scope2', id: '2' }] }] };
      }
      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { debug: true, appId: '3e64c22f-3f14-4bce-a267-cb44c9a08e17', resource: 'SharePoint', scopes: 'Sites.Read.All', force: true } } as any),
      new CommandError(`The scope value 'Sites.Read.All' you have specified does not exist for SharePoint. ${os.EOL}Available scopes (application permissions) are: ${os.EOL}Scope1${os.EOL}Scope2`));
  });

  it('rejects if no service principal found', async () => {
    sinonUtil.restore(request.get);
    sinon.stub(request, 'get').callsFake(async (opts: any): Promise<any> => {
      if ((opts.url as string).indexOf(`/v1.0/servicePrincipals?`) > -1) {
        // fake first call for getting service principal
        if (opts.url.indexOf('startswith') === -1) {
          return { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#servicePrincipals", "value": [] };
        }
        // second get request for searching for service principals by resource options value specified
        return { "value": [{ objectId: "df3d00f0-a24d-45a9-ba8b-3b0934ec3a6c", "appRoles": [{ value: 'Scope1', id: '1' }, { value: 'Scope2', id: '2' }] }] };
      }
      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { debug: true, appId: '3e64c22f-3f14-4bce-a267-cb44c9a08e17', resource: 'SharePoint', scopes: 'Sites.Read.All', force: true } } as any),
      new CommandError("app registration not found"));
  });

  it('rejects if app role assignment is not found', async () => {
    await assert.rejects(command.action(logger, { options: { debug: true, appId: '3e64c22f-3f14-4bce-a267-cb44c9a08e17', resource: 'SharePoint', scopes: 'Sites.ReadWrite.All', force: true } } as any),
      new CommandError("App role assignment not found"));
  });

  it('correctly handles API OData error', async () => {
    sinonUtil.restore(request.get);
    sinon.stub(request, 'get').rejects({
      error: {
        'odata.error': {
          code: '-1, InvalidOperationException',
          message: {
            value: `Resource '' does not exist or one of its queried reference-property objects are not present`
          }
        }
      }
    });

    await assert.rejects(command.action(logger, { options: { appId: '36e3a540-6f25-4483-9542-9f5fa00bb633', force: true } } as any),
      new CommandError(`Resource '' does not exist or one of its queried reference-property objects are not present`));
  });

  it('fails validation if neither appId, appObjectId nor appDisplayName are not specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { resource: 'abc', scopes: 'abc' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the appId is not a valid GUID', async () => {
    const actual = await command.validate({ options: { appId: '123', resource: 'abc', scopes: 'abc' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the appObjectId is not a valid GUID', async () => {
    const actual = await command.validate({ options: { appObjectId: '123', resource: 'abc', scopes: 'abc' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both appId and appDisplayName are specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { appId: '123', appDisplayName: 'abc', resource: 'abc', scopes: 'abc' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both appObjectId and appDisplayName are specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { appObjectId: '123', appDisplayName: 'abc', resource: 'abc', scopes: 'abc' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both appObjectId, appId and appDisplayName are specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { appId: '123', appObjectId: '123', appDisplayName: 'abc', resource: 'abc', scopes: 'abc' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when the appId option specified', async () => {
    const actual = await command.validate({ options: { appId: '57907bf8-73fa-43a6-89a5-1f603e29e452', resource: 'abc', scopes: 'abc' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('supports specifying appId', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--appId') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('supports specifying appDisplayName', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--appDisplayName') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('supports specifying confirmation flag', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--force') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });
});


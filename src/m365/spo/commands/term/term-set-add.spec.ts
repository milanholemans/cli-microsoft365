import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import config from '../../../../config.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import { spo } from '../../../../utils/spo.js';
import commands from '../../commands.js';
import command from './term-set-add.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.TERM_SET_ADD, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    sinon.stub(spo, 'getRequestDigest').resolves({
      FormDigestValue: 'ABC',
      FormDigestTimeoutSeconds: 1800,
      FormDigestExpiresAt: new Date(),
      WebFullUrl: 'https://contoso.sharepoint.com'
    });
    auth.connection.active = true;
    auth.connection.spoUrl = 'https://contoso.sharepoint.com';
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
      request.post,
      cli.getSettingWithDefaultValue
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
    auth.connection.spoUrl = undefined;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.TERM_SET_ADD);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('adds term set to term group specified with id', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetById"><Parameters><Parameter Type="Guid">{0e8f395e-ff58-4d45-9ff7-e331ab728beb}</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "3231949e-109d-0000-2cdb-ef525ee6aff1"
            }, 35, {
              "IsNull": false
            }, 36, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:ss:"
            }, 38, {
              "IsNull": false
            }, 39, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ=="
            }, 41, {
              "IsNull": false
            }, 43, {
              "IsNull": false
            }, 44, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:gr:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+s="
            }, 46, {
              "IsNull": false
            }, 47, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB"
            }, 48, {
              "_ObjectType_": "SP.Taxonomy.TermSet", "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB", "CreatedDate": "\/Date(1538418692608)\/", "Id": "\/Guid(b53f9aa1-1d35-4b39-8498-7e4705e57301)\/", "LastModifiedDate": "\/Date(1538418692608)\/", "Name": "PnP-Organizations", "CustomProperties": {

              }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Contact": "", "Description": "", "IsOpenForTermCreation": false, "Names": {
                "1033": "PnP-Organizations"
              }, "Stakeholders": [

              ]
            }
          ]);
        }
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { name: 'PnP-Organizations', termGroupId: '0e8f395e-ff58-4d45-9ff7-e331ab728beb' } });
    assert(loggerLogSpy.calledWith({
      CreatedDate: '2018-10-01T18:31:32.608Z',
      Id: 'b53f9aa1-1d35-4b39-8498-7e4705e57301',
      LastModifiedDate: '2018-10-01T18:31:32.608Z',
      Name: 'PnP-Organizations',
      CustomProperties: {},
      CustomSortOrder: null,
      IsAvailableForTagging: true,
      Owner: 'i:0#.f|membership|admin@contoso.onmicrosoft.com',
      Contact: '',
      Description: '',
      IsOpenForTermCreation: false,
      Names: { '1033': 'PnP-Organizations' },
      Stakeholders: []
    }));
  });

  it('adds term set to the specified sitecollection\'s term group specified by ID', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/sites/project-x/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetById"><Parameters><Parameter Type="Guid">{0e8f395e-ff58-4d45-9ff7-e331ab728beb}</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "3231949e-109d-0000-2cdb-ef525ee6aff1"
            }, 35, {
              "IsNull": false
            }, 36, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:ss:"
            }, 38, {
              "IsNull": false
            }, 39, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ=="
            }, 41, {
              "IsNull": false
            }, 43, {
              "IsNull": false
            }, 44, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:gr:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+s="
            }, 46, {
              "IsNull": false
            }, 47, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB"
            }, 48, {
              "_ObjectType_": "SP.Taxonomy.TermSet", "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB", "CreatedDate": "\/Date(1538418692608)\/", "Id": "\/Guid(b53f9aa1-1d35-4b39-8498-7e4705e57301)\/", "LastModifiedDate": "\/Date(1538418692608)\/", "Name": "PnP-Organizations", "CustomProperties": {

              }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Contact": "", "Description": "", "IsOpenForTermCreation": false, "Names": {
                "1033": "PnP-Organizations"
              }, "Stakeholders": [

              ]
            }
          ]);
        }
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com/sites/project-x', name: 'PnP-Organizations', termGroupId: '0e8f395e-ff58-4d45-9ff7-e331ab728beb' } });
    assert(loggerLogSpy.calledWith({
      CreatedDate: '2018-10-01T18:31:32.608Z',
      Id: 'b53f9aa1-1d35-4b39-8498-7e4705e57301',
      LastModifiedDate: '2018-10-01T18:31:32.608Z',
      Name: 'PnP-Organizations',
      CustomProperties: {},
      CustomSortOrder: null,
      IsAvailableForTagging: true,
      Owner: 'i:0#.f|membership|admin@contoso.onmicrosoft.com',
      Contact: '',
      Description: '',
      IsOpenForTermCreation: false,
      Names: { '1033': 'PnP-Organizations' },
      Stakeholders: []
    }));
  });

  it('adds term set to term group specified with name', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetByName"><Parameters><Parameter Type="String">PnPTermSets</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "3231949e-109d-0000-2cdb-ef525ee6aff1"
            }, 35, {
              "IsNull": false
            }, 36, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:ss:"
            }, 38, {
              "IsNull": false
            }, 39, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ=="
            }, 41, {
              "IsNull": false
            }, 43, {
              "IsNull": false
            }, 44, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:gr:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+s="
            }, 46, {
              "IsNull": false
            }, 47, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB"
            }, 48, {
              "_ObjectType_": "SP.Taxonomy.TermSet", "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB", "CreatedDate": "\/Date(1538418692608)\/", "Id": "\/Guid(b53f9aa1-1d35-4b39-8498-7e4705e57301)\/", "LastModifiedDate": "\/Date(1538418692608)\/", "Name": "PnP-Organizations", "CustomProperties": {

              }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Contact": "", "Description": "", "IsOpenForTermCreation": false, "Names": {
                "1033": "PnP-Organizations"
              }, "Stakeholders": [

              ]
            }
          ]);
        }
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { name: 'PnP-Organizations', termGroupName: 'PnPTermSets' } });
    assert(loggerLogSpy.calledWith({
      CreatedDate: '2018-10-01T18:31:32.608Z',
      Id: 'b53f9aa1-1d35-4b39-8498-7e4705e57301',
      LastModifiedDate: '2018-10-01T18:31:32.608Z',
      Name: 'PnP-Organizations',
      CustomProperties: {},
      CustomSortOrder: null,
      IsAvailableForTagging: true,
      Owner: 'i:0#.f|membership|admin@contoso.onmicrosoft.com',
      Contact: '',
      Description: '',
      IsOpenForTermCreation: false,
      Names: { '1033': 'PnP-Organizations' },
      Stakeholders: []
    }));
  });

  it('adds term set with a specified id to term group specified with id', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetById"><Parameters><Parameter Type="Guid">{0e8f395e-ff58-4d45-9ff7-e331ab728beb}</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{b53f9aa1-1d35-4b39-8498-7e4705e57301}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "3231949e-109d-0000-2cdb-ef525ee6aff1"
            }, 35, {
              "IsNull": false
            }, 36, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:ss:"
            }, 38, {
              "IsNull": false
            }, 39, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ=="
            }, 41, {
              "IsNull": false
            }, 43, {
              "IsNull": false
            }, 44, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:gr:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+s="
            }, 46, {
              "IsNull": false
            }, 47, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB"
            }, 48, {
              "_ObjectType_": "SP.Taxonomy.TermSet", "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB", "CreatedDate": "\/Date(1538418692608)\/", "Id": "\/Guid(b53f9aa1-1d35-4b39-8498-7e4705e57301)\/", "LastModifiedDate": "\/Date(1538418692608)\/", "Name": "PnP-Organizations", "CustomProperties": {

              }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Contact": "", "Description": "", "IsOpenForTermCreation": false, "Names": {
                "1033": "PnP-Organizations"
              }, "Stakeholders": [

              ]
            }
          ]);
        }
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { name: 'PnP-Organizations', termGroupId: '0e8f395e-ff58-4d45-9ff7-e331ab728beb', id: 'b53f9aa1-1d35-4b39-8498-7e4705e57301' } });
    assert(loggerLogSpy.calledWith({
      CreatedDate: '2018-10-01T18:31:32.608Z',
      Id: 'b53f9aa1-1d35-4b39-8498-7e4705e57301',
      LastModifiedDate: '2018-10-01T18:31:32.608Z',
      Name: 'PnP-Organizations',
      CustomProperties: {},
      CustomSortOrder: null,
      IsAvailableForTagging: true,
      Owner: 'i:0#.f|membership|admin@contoso.onmicrosoft.com',
      Contact: '',
      Description: '',
      IsOpenForTermCreation: false,
      Names: { '1033': 'PnP-Organizations' },
      Stakeholders: []
    }));
  });

  it('adds term set with a specified description to term group specified with id', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetById"><Parameters><Parameter Type="Guid">{0e8f395e-ff58-4d45-9ff7-e331ab728beb}</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "3231949e-109d-0000-2cdb-ef525ee6aff1"
            }, 35, {
              "IsNull": false
            }, 36, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:ss:"
            }, 38, {
              "IsNull": false
            }, 39, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ=="
            }, 41, {
              "IsNull": false
            }, 43, {
              "IsNull": false
            }, 44, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:gr:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+s="
            }, 46, {
              "IsNull": false
            }, 47, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB"
            }, 48, {
              "_ObjectType_": "SP.Taxonomy.TermSet", "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB", "CreatedDate": "\/Date(1538418692608)\/", "Id": "\/Guid(b53f9aa1-1d35-4b39-8498-7e4705e57301)\/", "LastModifiedDate": "\/Date(1538418692608)\/", "Name": "PnP-Organizations", "CustomProperties": {

              }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Contact": "", "Description": "", "IsOpenForTermCreation": false, "Names": {
                "1033": "PnP-Organizations"
              }, "Stakeholders": [

              ]
            }
          ]);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="127" ObjectPathId="117" Name="Description"><Parameter Type="String">List of organizations</Parameter></SetProperty><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB" /><Identity Id="109" Name="3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "1332949e-609b-0000-2cdb-e238bddae823"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { debug: true, name: 'PnP-Organizations', termGroupId: '0e8f395e-ff58-4d45-9ff7-e331ab728beb', description: 'List of organizations' } });
    assert(loggerLogSpy.calledWith({
      CreatedDate: '2018-10-01T18:31:32.608Z',
      Id: 'b53f9aa1-1d35-4b39-8498-7e4705e57301',
      LastModifiedDate: '2018-10-01T18:31:32.608Z',
      Name: 'PnP-Organizations',
      CustomProperties: {},
      CustomSortOrder: null,
      IsAvailableForTagging: true,
      Owner: 'i:0#.f|membership|admin@contoso.onmicrosoft.com',
      Contact: '',
      Description: 'List of organizations',
      IsOpenForTermCreation: false,
      Names: { '1033': 'PnP-Organizations' },
      Stakeholders: []
    }));
  });

  it('adds term set with custom properties to term group specified with id', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetById"><Parameters><Parameter Type="Guid">{0e8f395e-ff58-4d45-9ff7-e331ab728beb}</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "3231949e-109d-0000-2cdb-ef525ee6aff1"
            }, 35, {
              "IsNull": false
            }, 36, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:ss:"
            }, 38, {
              "IsNull": false
            }, 39, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ=="
            }, 41, {
              "IsNull": false
            }, 43, {
              "IsNull": false
            }, 44, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:gr:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+s="
            }, 46, {
              "IsNull": false
            }, 47, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB"
            }, 48, {
              "_ObjectType_": "SP.Taxonomy.TermSet", "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB", "CreatedDate": "\/Date(1538418692608)\/", "Id": "\/Guid(b53f9aa1-1d35-4b39-8498-7e4705e57301)\/", "LastModifiedDate": "\/Date(1538418692608)\/", "Name": "PnP-Organizations", "CustomProperties": {

              }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Contact": "", "Description": "", "IsOpenForTermCreation": false, "Names": {
                "1033": "PnP-Organizations"
              }, "Stakeholders": [

              ]
            }
          ]);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetCustomProperty" Id="127" ObjectPathId="117"><Parameters><Parameter Type="String">Prop1</Parameter><Parameter Type="String">Value 1</Parameter></Parameters></Method><Method Name="SetCustomProperty" Id="128" ObjectPathId="117"><Parameters><Parameter Type="String">Prop2</Parameter><Parameter Type="String">Value 2</Parameter></Parameters></Method><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB" /><Identity Id="109" Name="3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "1332949e-609b-0000-2cdb-e238bddae823"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { name: 'PnP-Organizations', termGroupId: '0e8f395e-ff58-4d45-9ff7-e331ab728beb', customProperties: JSON.stringify({ Prop1: 'Value 1', Prop2: 'Value 2' }) } });
    assert(loggerLogSpy.calledWith({
      CreatedDate: '2018-10-01T18:31:32.608Z',
      Id: 'b53f9aa1-1d35-4b39-8498-7e4705e57301',
      LastModifiedDate: '2018-10-01T18:31:32.608Z',
      Name: 'PnP-Organizations',
      CustomProperties: {
        Prop1: 'Value 1',
        Prop2: 'Value 2'
      },
      CustomSortOrder: null,
      IsAvailableForTagging: true,
      Owner: 'i:0#.f|membership|admin@contoso.onmicrosoft.com',
      Contact: '',
      Description: '',
      IsOpenForTermCreation: false,
      Names: { '1033': 'PnP-Organizations' },
      Stakeholders: []
    }));
  });

  it('correctly handles error when retrieving the term store', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetByName"><Parameters><Parameter Type="String">PnPTermSets</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8112.1217", "ErrorInfo": {
                "ErrorMessage": "An error has occurred", "ErrorValue": null, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6", "ErrorCode": -2147024809, "ErrorTypeName": "System.ArgumentException"
              }, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { name: 'PnP-Organizations', termGroupName: 'PnPTermSets' } } as any), new CommandError('An error has occurred'));
  });

  it('correctly handles error when the term group specified by id doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetById"><Parameters><Parameter Type="Guid">{0e8f395e-ff58-4d45-9ff7-e331ab728beb}</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8105.1217", "ErrorInfo": {
                "ErrorMessage": "Specified argument was out of the range of valid values.\r\nParameter name: index", "ErrorValue": null, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78", "ErrorCode": -2146233086, "ErrorTypeName": "System.ArgumentOutOfRangeException"
              }, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });
    await assert.rejects(command.action(logger, {
      options: {
        name: 'PnP-Organizations',
        termGroupId: '0e8f395e-ff58-4d45-9ff7-e331ab728beb'
      }
    } as any), new CommandError('Specified argument was out of the range of valid values.\r\nParameter name: index'));
  });

  it('correctly handles error when the term group specified by name doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetByName"><Parameters><Parameter Type="String">PnPTermSets</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8105.1217", "ErrorInfo": {
                "ErrorMessage": "Specified argument was out of the range of valid values.\r\nParameter name: index", "ErrorValue": null, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78", "ErrorCode": -2146233086, "ErrorTypeName": "System.ArgumentOutOfRangeException"
              }, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { name: 'PnP-Organizations', termGroupName: 'PnPTermSets' } } as any), new CommandError('Specified argument was out of the range of valid values.\r\nParameter name: index'));
  });

  it('correctly handles error when the specified name already exists', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetByName"><Parameters><Parameter Type="String">PnPTermSets</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8105.1217", "ErrorInfo": {
                "ErrorMessage": "A term set already exists with the name specified.", "ErrorValue": null, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78", "ErrorCode": -2146233086, "ErrorTypeName": "Microsoft.SharePoint.Taxonomy.TermStoreOperationException"
              }, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });
    await assert.rejects(command.action(logger, { options: { name: 'PnP-Organizations', termGroupName: 'PnPTermSets' } } as any), new CommandError('A term set already exists with the name specified.'));
  });

  it('correctly handles error when the specified id already exists', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetByName"><Parameters><Parameter Type="String">PnPTermSets</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{aca21974-139c-44fd-813c-6bbe6f25e658}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8105.1217", "ErrorInfo": {
                "ErrorMessage": "Failed to read from or write to database. Refresh and try again. If the problem persists, please contact the administrator.", "ErrorValue": null, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78", "ErrorCode": -2146233086, "ErrorTypeName": "Microsoft.SharePoint.Taxonomy.TermStoreOperationException"
              }, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { name: 'PnP-Organizations', id: 'aca21974-139c-44fd-813c-6bbe6f25e658', termGroupName: 'PnPTermSets' } } as any), new CommandError('Failed to read from or write to database. Refresh and try again. If the problem persists, please contact the administrator.'));
  });

  it('correctly handles error when setting the description', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetById"><Parameters><Parameter Type="Guid">{0e8f395e-ff58-4d45-9ff7-e331ab728beb}</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "3231949e-109d-0000-2cdb-ef525ee6aff1"
            }, 35, {
              "IsNull": false
            }, 36, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:ss:"
            }, 38, {
              "IsNull": false
            }, 39, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ=="
            }, 41, {
              "IsNull": false
            }, 43, {
              "IsNull": false
            }, 44, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:gr:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+s="
            }, 46, {
              "IsNull": false
            }, 47, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB"
            }, 48, {
              "_ObjectType_": "SP.Taxonomy.TermSet", "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB", "CreatedDate": "\/Date(1538418692608)\/", "Id": "\/Guid(b53f9aa1-1d35-4b39-8498-7e4705e57301)\/", "LastModifiedDate": "\/Date(1538418692608)\/", "Name": "PnP-Organizations", "CustomProperties": {

              }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Contact": "", "Description": "", "IsOpenForTermCreation": false, "Names": {
                "1033": "PnP-Organizations"
              }, "Stakeholders": [

              ]
            }
          ]);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="127" ObjectPathId="117" Name="Description"><Parameter Type="String">List of organizations</Parameter></SetProperty><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB" /><Identity Id="109" Name="3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8112.1217", "ErrorInfo": {
                "ErrorMessage": "An error has occurred", "ErrorValue": null, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6", "ErrorCode": -2147024809, "ErrorTypeName": "System.ArgumentException"
              }, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { name: 'PnP-Organizations', termGroupId: '0e8f395e-ff58-4d45-9ff7-e331ab728beb', description: 'List of organizations' } } as any), new CommandError('An error has occurred'));
  });

  it('correctly handles error when setting custom properties', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetById"><Parameters><Parameter Type="Guid">{0e8f395e-ff58-4d45-9ff7-e331ab728beb}</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "3231949e-109d-0000-2cdb-ef525ee6aff1"
            }, 35, {
              "IsNull": false
            }, 36, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:ss:"
            }, 38, {
              "IsNull": false
            }, 39, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ=="
            }, 41, {
              "IsNull": false
            }, 43, {
              "IsNull": false
            }, 44, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:gr:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+s="
            }, 46, {
              "IsNull": false
            }, 47, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB"
            }, 48, {
              "_ObjectType_": "SP.Taxonomy.TermSet", "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB", "CreatedDate": "\/Date(1538418692608)\/", "Id": "\/Guid(b53f9aa1-1d35-4b39-8498-7e4705e57301)\/", "LastModifiedDate": "\/Date(1538418692608)\/", "Name": "PnP-Organizations", "CustomProperties": {

              }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Contact": "", "Description": "", "IsOpenForTermCreation": false, "Names": {
                "1033": "PnP-Organizations"
              }, "Stakeholders": [

              ]
            }
          ]);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetCustomProperty" Id="127" ObjectPathId="117"><Parameters><Parameter Type="String">Prop1</Parameter><Parameter Type="String">Value 1</Parameter></Parameters></Method><Method Name="SetCustomProperty" Id="128" ObjectPathId="117"><Parameters><Parameter Type="String">Prop2</Parameter><Parameter Type="String">Value 2</Parameter></Parameters></Method><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB" /><Identity Id="109" Name="3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8112.1217", "ErrorInfo": {
                "ErrorMessage": "An error has occurred", "ErrorValue": null, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6", "ErrorCode": -2147024809, "ErrorTypeName": "System.ArgumentException"
              }, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: 'PnP-Organizations',
        termGroupId: '0e8f395e-ff58-4d45-9ff7-e331ab728beb',
        customProperties: JSON.stringify({ Prop1: 'Value 1', Prop2: 'Value 2' })
      }
    } as any), new CommandError('An error has occurred'));
  });

  it('correctly escapes XML in term group name', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetByName"><Parameters><Parameter Type="String">PnPTermSets&gt;</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "3231949e-109d-0000-2cdb-ef525ee6aff1"
            }, 35, {
              "IsNull": false
            }, 36, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:ss:"
            }, 38, {
              "IsNull": false
            }, 39, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ=="
            }, 41, {
              "IsNull": false
            }, 43, {
              "IsNull": false
            }, 44, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:gr:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+s="
            }, 46, {
              "IsNull": false
            }, 47, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB"
            }, 48, {
              "_ObjectType_": "SP.Taxonomy.TermSet", "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB", "CreatedDate": "\/Date(1538418692608)\/", "Id": "\/Guid(b53f9aa1-1d35-4b39-8498-7e4705e57301)\/", "LastModifiedDate": "\/Date(1538418692608)\/", "Name": "PnP-Organizations", "CustomProperties": {

              }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Contact": "", "Description": "", "IsOpenForTermCreation": false, "Names": {
                "1033": "PnP-Organizations"
              }, "Stakeholders": [

              ]
            }
          ]);
        }
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { name: 'PnP-Organizations', termGroupName: 'PnPTermSets>' } });
    assert(loggerLogSpy.calledWith({
      CreatedDate: '2018-10-01T18:31:32.608Z',
      Id: 'b53f9aa1-1d35-4b39-8498-7e4705e57301',
      LastModifiedDate: '2018-10-01T18:31:32.608Z',
      Name: 'PnP-Organizations',
      CustomProperties: {},
      CustomSortOrder: null,
      IsAvailableForTagging: true,
      Owner: 'i:0#.f|membership|admin@contoso.onmicrosoft.com',
      Contact: '',
      Description: '',
      IsOpenForTermCreation: false,
      Names: { '1033': 'PnP-Organizations' },
      Stakeholders: []
    }));
  });

  it('correctly escapes XML in term set name', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetByName"><Parameters><Parameter Type="String">PnPTermSets</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations&gt;</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "3231949e-109d-0000-2cdb-ef525ee6aff1"
            }, 35, {
              "IsNull": false
            }, 36, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:ss:"
            }, 38, {
              "IsNull": false
            }, 39, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ=="
            }, 41, {
              "IsNull": false
            }, 43, {
              "IsNull": false
            }, 44, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:gr:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+s="
            }, 46, {
              "IsNull": false
            }, 47, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB"
            }, 48, {
              "_ObjectType_": "SP.Taxonomy.TermSet", "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB", "CreatedDate": "\/Date(1538418692608)\/", "Id": "\/Guid(b53f9aa1-1d35-4b39-8498-7e4705e57301)\/", "LastModifiedDate": "\/Date(1538418692608)\/", "Name": "PnP-Organizations>", "CustomProperties": {

              }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Contact": "", "Description": "", "IsOpenForTermCreation": false, "Names": {
                "1033": "PnP-Organizations>"
              }, "Stakeholders": [

              ]
            }
          ]);
        }
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { name: 'PnP-Organizations>', termGroupName: 'PnPTermSets' } });
    assert(loggerLogSpy.calledWith({
      CreatedDate: '2018-10-01T18:31:32.608Z',
      Id: 'b53f9aa1-1d35-4b39-8498-7e4705e57301',
      LastModifiedDate: '2018-10-01T18:31:32.608Z',
      Name: 'PnP-Organizations>',
      CustomProperties: {},
      CustomSortOrder: null,
      IsAvailableForTagging: true,
      Owner: 'i:0#.f|membership|admin@contoso.onmicrosoft.com',
      Contact: '',
      Description: '',
      IsOpenForTermCreation: false,
      Names: { '1033': 'PnP-Organizations>' },
      Stakeholders: []
    }));
  });

  it('correctly escapes XML in term set description', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetById"><Parameters><Parameter Type="Guid">{0e8f395e-ff58-4d45-9ff7-e331ab728beb}</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "3231949e-109d-0000-2cdb-ef525ee6aff1"
            }, 35, {
              "IsNull": false
            }, 36, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:ss:"
            }, 38, {
              "IsNull": false
            }, 39, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ=="
            }, 41, {
              "IsNull": false
            }, 43, {
              "IsNull": false
            }, 44, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:gr:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+s="
            }, 46, {
              "IsNull": false
            }, 47, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB"
            }, 48, {
              "_ObjectType_": "SP.Taxonomy.TermSet", "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB", "CreatedDate": "\/Date(1538418692608)\/", "Id": "\/Guid(b53f9aa1-1d35-4b39-8498-7e4705e57301)\/", "LastModifiedDate": "\/Date(1538418692608)\/", "Name": "PnP-Organizations", "CustomProperties": {

              }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Contact": "", "Description": "", "IsOpenForTermCreation": false, "Names": {
                "1033": "PnP-Organizations"
              }, "Stakeholders": [

              ]
            }
          ]);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="127" ObjectPathId="117" Name="Description"><Parameter Type="String">List of organizations&gt;</Parameter></SetProperty><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB" /><Identity Id="109" Name="3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "1332949e-609b-0000-2cdb-e238bddae823"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { name: 'PnP-Organizations', termGroupId: '0e8f395e-ff58-4d45-9ff7-e331ab728beb', description: 'List of organizations>' } });
    assert(loggerLogSpy.calledWith({
      CreatedDate: '2018-10-01T18:31:32.608Z',
      Id: 'b53f9aa1-1d35-4b39-8498-7e4705e57301',
      LastModifiedDate: '2018-10-01T18:31:32.608Z',
      Name: 'PnP-Organizations',
      CustomProperties: {},
      CustomSortOrder: null,
      IsAvailableForTagging: true,
      Owner: 'i:0#.f|membership|admin@contoso.onmicrosoft.com',
      Contact: '',
      Description: 'List of organizations>',
      IsOpenForTermCreation: false,
      Names: { '1033': 'PnP-Organizations' },
      Stakeholders: []
    }));
  });

  it('correctly escapes XML in term set custom properties', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="35" ObjectPathId="34" /><ObjectIdentityQuery Id="36" ObjectPathId="34" /><ObjectPath Id="38" ObjectPathId="37" /><ObjectIdentityQuery Id="39" ObjectPathId="37" /><ObjectPath Id="41" ObjectPathId="40" /><ObjectPath Id="43" ObjectPathId="42" /><ObjectIdentityQuery Id="44" ObjectPathId="42" /><ObjectPath Id="46" ObjectPathId="45" /><ObjectIdentityQuery Id="47" ObjectPathId="45" /><Query Id="48" ObjectPathId="45"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="34" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="37" ParentId="34" Name="GetDefaultSiteCollectionTermStore" /><Property Id="40" ParentId="37" Name="Groups" /><Method Id="42" ParentId="40" Name="GetById"><Parameters><Parameter Type="Guid">{0e8f395e-ff58-4d45-9ff7-e331ab728beb}</Parameter></Parameters></Method><Method Id="45" ParentId="42" Name="CreateTermSet"><Parameters><Parameter Type="String">PnP-Organizations</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "3231949e-109d-0000-2cdb-ef525ee6aff1"
            }, 35, {
              "IsNull": false
            }, 36, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:ss:"
            }, 38, {
              "IsNull": false
            }, 39, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ=="
            }, 41, {
              "IsNull": false
            }, 43, {
              "IsNull": false
            }, 44, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:gr:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+s="
            }, 46, {
              "IsNull": false
            }, 47, {
              "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB"
            }, 48, {
              "_ObjectType_": "SP.Taxonomy.TermSet", "_ObjectIdentity_": "3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB", "CreatedDate": "\/Date(1538418692608)\/", "Id": "\/Guid(b53f9aa1-1d35-4b39-8498-7e4705e57301)\/", "LastModifiedDate": "\/Date(1538418692608)\/", "Name": "PnP-Organizations", "CustomProperties": {

              }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Contact": "", "Description": "", "IsOpenForTermCreation": false, "Names": {
                "1033": "PnP-Organizations"
              }, "Stakeholders": [

              ]
            }
          ]);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetCustomProperty" Id="127" ObjectPathId="117"><Parameters><Parameter Type="String">Prop1</Parameter><Parameter Type="String">&lt;Value 1</Parameter></Parameters></Method><Method Name="SetCustomProperty" Id="128" ObjectPathId="117"><Parameters><Parameter Type="String">Prop2</Parameter><Parameter Type="String">Value 2&gt;</Parameter></Parameters></Method><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:se:YU1+cBy9wUuh\u002ffzgFZGpUV45jw5Y\u002f0VNn\u002ffjMatyi+uhmj+1NR05S4SYfkcF5XMB" /><Identity Id="109" Name="3231949e-109d-0000-2cdb-ef525ee6aff1|fec14c62-7c3b-481b-851b-c80d7802b224:st:YU1+cBy9wUuh\u002ffzgFZGpUQ==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8119.1219", "ErrorInfo": null, "TraceCorrelationId": "1332949e-609b-0000-2cdb-e238bddae823"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { name: 'PnP-Organizations', termGroupId: '0e8f395e-ff58-4d45-9ff7-e331ab728beb', customProperties: JSON.stringify({ Prop1: '<Value 1', Prop2: 'Value 2>' }) } });
    assert(loggerLogSpy.calledWith({
      CreatedDate: '2018-10-01T18:31:32.608Z',
      Id: 'b53f9aa1-1d35-4b39-8498-7e4705e57301',
      LastModifiedDate: '2018-10-01T18:31:32.608Z',
      Name: 'PnP-Organizations',
      CustomProperties: {
        Prop1: '<Value 1',
        Prop2: 'Value 2>'
      },
      CustomSortOrder: null,
      IsAvailableForTagging: true,
      Owner: 'i:0#.f|membership|admin@contoso.onmicrosoft.com',
      Contact: '',
      Description: '',
      IsOpenForTermCreation: false,
      Names: { '1033': 'PnP-Organizations' },
      Stakeholders: []
    }));
  });

  it('fails validation if id is not a valid GUID', async () => {
    const actual = await command.validate({ options: { termGroupName: 'PnPTermSets', name: 'PnP-Organizations', id: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if neither termGroupId nor termGroupName specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { name: 'PnP-Organizations' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both termGroupId and termGroupName specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { name: 'PnP-Organizations', termGroupName: 'PnPTermSets', termGroupId: 'aca21974-139c-44fd-813c-6bbe6f25e658' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if termGroupId is not a valid GUID', async () => {
    const actual = await command.validate({ options: { name: 'PnP-Organizations', termGroupId: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if custom properties is not a valid JSON string', async () => {
    const actual = await command.validate({ options: { name: 'PnP-Organizations', termGroupName: 'PnPTermSets', customProperties: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation when webUrl is not a valid url', async () => {
    const actual = await command.validate({ options: { webUrl: 'abc', name: 'PnP-Organizations', termGroupName: 'PnPTermSets' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when the webUrl is a valid url', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com/sites/project-x', name: 'PnP-Organizations', termGroupName: 'PnPTermSets' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when id, name and termGroupId specified', async () => {
    const actual = await command.validate({ options: { name: 'PnP-Organizations', id: '9e54299e-208a-4000-8546-cc4139091b26', termGroupId: '9e54299e-208a-4000-8546-cc4139091b27' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when id, name and termGroupName specified', async () => {
    const actual = await command.validate({ options: { name: 'PnP-Organizations', id: '9e54299e-208a-4000-8546-cc4139091b26', termGroupName: 'PnPTermSets' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when name and termGroupId specified', async () => {
    const actual = await command.validate({ options: { name: 'People', termGroupId: '9e54299e-208a-4000-8546-cc4139091b26' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when name and termGroupName specified', async () => {
    const actual = await command.validate({ options: { name: 'People', termGroupName: 'PnPTermSets' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when custom properties is a valid JSON string', async () => {
    const actual = await command.validate({ options: { name: 'PnP-Organizations', termGroupName: 'PnPTermSets', customProperties: '{}' } }, commandInfo);
    assert.strictEqual(actual, true);
  });
});
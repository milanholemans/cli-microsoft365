import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './hubsite-list.js';

describe(commands.HUBSITE_LIST, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    auth.connection.active = true;
    auth.connection.spoUrl = 'https://contoso.sharepoint.com';
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
    (command as any).batchSize = 30;
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get,
      request.post
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
    auth.connection.spoUrl = undefined;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.HUBSITE_LIST);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('defines correct properties for the default output', () => {
    assert.deepStrictEqual(command.defaultProperties(), ['ID', 'SiteUrl', 'Title']);
  });

  it('lists hub sites', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/hubsites`) > -1) {
        return {
          value: [
            {
              "Description": null,
              "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
              "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
              "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
              "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
              "Targets": null,
              "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
              "Title": "Sales"
            },
            {
              "Description": null,
              "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
              "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
              "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
              "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
              "Targets": null,
              "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
              "Title": "Travel Programs"
            }
          ]
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: {} });
    assert(loggerLogSpy.calledWith([
      {
        "Description": null,
        "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
        "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
        "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
        "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
        "Targets": null,
        "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
        "Title": "Sales"
      },
      {
        "Description": null,
        "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
        "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
        "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
        "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
        "Targets": null,
        "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
        "Title": "Travel Programs"
      }
    ]));
  });

  it('lists hub sites (debug)', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/hubsites`) > -1) {
        return {
          value: [
            {
              "Description": null,
              "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
              "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
              "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
              "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
              "Targets": null,
              "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
              "Title": "Sales"
            },
            {
              "Description": null,
              "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
              "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
              "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
              "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
              "Targets": null,
              "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
              "Title": "Travel Programs"
            }
          ]
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true } });
    assert(loggerLogSpy.calledWith([
      {
        "Description": null,
        "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
        "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
        "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
        "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
        "Targets": null,
        "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
        "Title": "Sales"
      },
      {
        "Description": null,
        "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
        "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
        "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
        "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
        "Targets": null,
        "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
        "Title": "Travel Programs"
      }
    ]));
  });

  it('lists hub sites with all properties', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/hubsites`) > -1) {
        return {
          value: [
            {
              "Description": null,
              "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
              "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
              "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
              "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
              "Targets": null,
              "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
              "Title": "Sales"
            },
            {
              "Description": null,
              "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
              "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
              "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
              "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
              "Targets": null,
              "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
              "Title": "Travel Programs"
            }
          ]
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { output: 'json' } });
    assert(loggerLogSpy.calledWith([
      {
        "Description": null,
        "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
        "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
        "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
        "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
        "Targets": null,
        "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
        "Title": "Sales"
      },
      {
        "Description": null,
        "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
        "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
        "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
        "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
        "Targets": null,
        "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
        "Title": "Travel Programs"
      }
    ]));
  });

  it(`correctly shows deprecation warning for option 'includeAssociatedSites'`, async () => {
    const chalk = (await import('chalk')).default;
    const loggerErrSpy = sinon.spy(logger, 'logToStderr');

    // Cast the command class instance to any so we can set the private
    // property 'batchSize' to a small number for easier testing
    const newBatchSize = 3;
    (command as any).batchSize = newBatchSize;

    sinon.stub(request, 'get').resolves({
      value: [
        {
          "Description": null,
          "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Sales"
        },
        {
          "Description": null,
          "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Travel Programs"
        }
      ]
    });

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/lists/GetByTitle('DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECOLLECTIONS')/RenderListDataAsStream`) > -1
        && opts.data.parameters.ViewXml.indexOf('<RowLimit Paged="TRUE">' + newBatchSize + '</RowLimit>') > -1) {
        if ((opts.url as string).indexOf('?Paged=TRUE') === -1) {
          return {
            FilterLink: "?",
            FirstRow: 1,
            FolderPermissions: "0x7fffffffffffffff",
            ForceNoHierarchy: 1,
            HierarchyHasIndention: null,
            LastRow: 3,
            NextHref: "?Paged=TRUE&p_Title=Another%20Hub%20Sub%202&p_ID=32&PageFirstRow=4&View=00000000-0000-0000-0000-00000000000",
            Row: [{ "ID": "30", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/30_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F30%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/30_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/30_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "554", "Title": "Another Hub Root", "SiteUrl": "https://contoso.sharepoint.com/sites/AnotherHubRoot", "SiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "HubSiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "31", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/31_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F31%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/31_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/31_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "556", "Title": "Another Hub Sub 1", "SiteUrl": "https://contoso.sharepoint.com/sites/AnotherHubSub1", "SiteId": "{3A569D44-D3CD-45AB-9AB8-87675D18AF63}", "HubSiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "32", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/32_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F32%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/32_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/32_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "556", "Title": "Another Hub Sub 2", "SiteUrl": "https://contoso.sharepoint.com/sites/AnotherHubSub2", "SiteId": "{794FE8EC-458F-444B-A799-E179AB786784}", "HubSiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "TimeDeleted": "", "State": "", "State.": "" }],
            RowLimit: 3
          };
        }

        if ((opts.url as string).indexOf('?Paged=TRUE&p_Title=Another%20Hub%20Sub%202&p_ID=32&PageFirstRow=4&View=00000000-0000-0000-0000-00000000000') > -1) {
          return {
            FilterLink: "?",
            FirstRow: 4,
            FolderPermissions: "0x7fffffffffffffff",
            ForceNoHierarchy: 1,
            HierarchyHasIndention: null,
            LastRow: 6,
            NextHref: "?Paged=TRUE&p_Title=Hub%20sub%204&p_ID=29&PageFirstRow=7&View=00000000-0000-0000-0000-00000000000",
            PrevHref: "?&&p_Title=Hub%20sub%201&&PageFirstRow=1&View=00000000-0000-0000-0000-000000000000",
            Row: [{ "ID": "25", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/25_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F25%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/25_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/25_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "518", "Title": "Hub sub 1", "SiteUrl": "https://contoso.sharepoint.com/sites/Hubsub1", "SiteId": "{83C2E5B0-DC64-4040-AB1F-A6A9A8169E46}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "28", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/28_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F28%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/28_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/28_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "550", "Title": "Hub sub 3", "SiteUrl": "https://contoso.sharepoint.com/sites/Hubsub3", "SiteId": "{5509F9AC-ECF8-488A-B960-BEDF4D8FB321}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "29", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/29_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F29%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/29_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/29_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "518", "Title": "Hub sub 4", "SiteUrl": "https://contoso.sharepoint.com/sites/Hubsub4", "SiteId": "{8AC9E1ED-29B8-4342-AF30-11F597731F8A}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }],
            RowLimit: 3
          };
        }

        if ((opts.url as string).indexOf('?Paged=TRUE&p_Title=Hub%20sub%204&p_ID=29&PageFirstRow=7&View=00000000-0000-0000-0000-00000000000') > -1) {
          return {
            FilterLink: "?",
            FirstRow: 7,
            FolderPermissions: "0x7fffffffffffffff",
            ForceNoHierarchy: 1,
            HierarchyHasIndention: null,
            LastRow: 8,
            PrevHref: "?Paged=TRUE&PagedPrev=TRUE&p_Title=Hub%20sub%20x&p_ID=27&PageFirstRow=4&View=00000000-0000-0000-0000-000000000000",
            Row: [{ "ID": "27", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/27_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F27%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/27_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/27_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "550", "Title": "Hub sub x", "SiteUrl": "https://contoso.sharepoint.com/sites/Hubsubx", "SiteId": "{DC0D0D79-1B0D-45A7-A8EE-7B97679B79DE}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "24", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/24_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F24%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/24_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/24_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "514", "Title": "Root Hub", "SiteUrl": "https://contoso.sharepoint.com/sites/RootHub", "SiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }],
            RowLimit: 3
          };
        }
        throw 'Invalid request';
      }
      throw 'Invalid request';
    });

    await command.action(logger, { options: { includeAssociatedSites: true, output: 'json' } });
    assert(loggerErrSpy.calledWith(chalk.yellow(`Parameter 'includeAssociatedSites' is deprecated. Please use 'withAssociatedSites' instead`)));

    sinonUtil.restore(loggerErrSpy);
  });

  it('correctly handles OData error when retrieving hub sites', async () => {
    sinon.stub(request, 'get').rejects({ error: { 'odata.error': { message: { value: 'An error has occurred' } } } });

    await assert.rejects(command.action(logger, { options: {} } as any),
      new CommandError('An error has occurred'));
  });

  it('correctly retrieves the associated sites in batches', async () => {
    // Cast the command class instance to any so we can set the private
    // property 'batchSize' to a small number for easier testing
    const newBatchSize = 3;
    (command as any).batchSize = newBatchSize;
    let firstPagedRequest: boolean = false;
    let secondPagedRequest: boolean = false;
    let thirdPagedRequest: boolean = false;

    sinon.stub(request, 'get').resolves({
      value: [
        {
          "Description": null,
          "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Sales"
        },
        {
          "Description": null,
          "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Travel Programs"
        }
      ]
    });

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/lists/GetByTitle('DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECOLLECTIONS')/RenderListDataAsStream`) > -1
        && opts.data.parameters.ViewXml.indexOf('<RowLimit Paged="TRUE">' + newBatchSize + '</RowLimit>') > -1) {
        if ((opts.url as string).indexOf('?Paged=TRUE') === -1) {
          firstPagedRequest = true;
          return {
            FilterLink: "?",
            FirstRow: 1,
            FolderPermissions: "0x7fffffffffffffff",
            ForceNoHierarchy: 1,
            HierarchyHasIndention: null,
            LastRow: 3,
            NextHref: "?Paged=TRUE&p_Title=Another%20Hub%20Sub%202&p_ID=32&PageFirstRow=4&View=00000000-0000-0000-0000-00000000000",
            Row: [{ "ID": "30", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/30_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F30%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/30_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/30_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "554", "Title": "Another Hub Root", "SiteUrl": "https://contoso.sharepoint.com/sites/AnotherHubRoot", "SiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "HubSiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "31", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/31_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F31%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/31_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/31_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "556", "Title": "Another Hub Sub 1", "SiteUrl": "https://contoso.sharepoint.com/sites/AnotherHubSub1", "SiteId": "{3A569D44-D3CD-45AB-9AB8-87675D18AF63}", "HubSiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "32", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/32_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F32%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/32_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/32_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "556", "Title": "Another Hub Sub 2", "SiteUrl": "https://contoso.sharepoint.com/sites/AnotherHubSub2", "SiteId": "{794FE8EC-458F-444B-A799-E179AB786784}", "HubSiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "TimeDeleted": "", "State": "", "State.": "" }],
            RowLimit: 3
          };
        }

        if ((opts.url as string).indexOf('?Paged=TRUE&p_Title=Another%20Hub%20Sub%202&p_ID=32&PageFirstRow=4&View=00000000-0000-0000-0000-00000000000') > -1) {
          secondPagedRequest = true;
          return {
            FilterLink: "?",
            FirstRow: 4,
            FolderPermissions: "0x7fffffffffffffff",
            ForceNoHierarchy: 1,
            HierarchyHasIndention: null,
            LastRow: 6,
            NextHref: "?Paged=TRUE&p_Title=Hub%20sub%204&p_ID=29&PageFirstRow=7&View=00000000-0000-0000-0000-00000000000",
            PrevHref: "?&&p_Title=Hub%20sub%201&&PageFirstRow=1&View=00000000-0000-0000-0000-000000000000",
            Row: [{ "ID": "25", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/25_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F25%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/25_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/25_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "518", "Title": "Hub sub 1", "SiteUrl": "https://contoso.sharepoint.com/sites/Hubsub1", "SiteId": "{83C2E5B0-DC64-4040-AB1F-A6A9A8169E46}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "28", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/28_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F28%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/28_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/28_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "550", "Title": "Hub sub 3", "SiteUrl": "https://contoso.sharepoint.com/sites/Hubsub3", "SiteId": "{5509F9AC-ECF8-488A-B960-BEDF4D8FB321}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "29", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/29_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F29%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/29_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/29_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "518", "Title": "Hub sub 4", "SiteUrl": "https://contoso.sharepoint.com/sites/Hubsub4", "SiteId": "{8AC9E1ED-29B8-4342-AF30-11F597731F8A}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }],
            RowLimit: 3
          };
        }

        if ((opts.url as string).indexOf('?Paged=TRUE&p_Title=Hub%20sub%204&p_ID=29&PageFirstRow=7&View=00000000-0000-0000-0000-00000000000') > -1) {
          thirdPagedRequest = true;
          return {
            FilterLink: "?",
            FirstRow: 7,
            FolderPermissions: "0x7fffffffffffffff",
            ForceNoHierarchy: 1,
            HierarchyHasIndention: null,
            LastRow: 8,
            PrevHref: "?Paged=TRUE&PagedPrev=TRUE&p_Title=Hub%20sub%20x&p_ID=27&PageFirstRow=4&View=00000000-0000-0000-0000-000000000000",
            Row: [{ "ID": "27", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/27_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F27%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/27_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/27_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "550", "Title": "Hub sub x", "SiteUrl": "https://contoso.sharepoint.com/sites/Hubsubx", "SiteId": "{DC0D0D79-1B0D-45A7-A8EE-7B97679B79DE}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "24", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/24_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F24%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/24_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/24_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "514", "Title": "Root Hub", "SiteUrl": "https://contoso.sharepoint.com/sites/RootHub", "SiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }],
            RowLimit: 3
          };
        }
        throw 'Invalid request';
      }
      throw 'Invalid request';
    });

    await command.action(logger, { options: { withAssociatedSites: true, output: 'json' } });
    assert.strictEqual((firstPagedRequest && secondPagedRequest && thirdPagedRequest), true);
  });

  it('correctly retrieves the associated sites in batches (debug)', async () => {
    // Cast the command class instance to any so we can set the private
    // property 'batchSize' to a small number for easier testing
    const newBatchSize = 3;
    (command as any).batchSize = newBatchSize;
    let firstPagedRequest: boolean = false;
    let secondPagedRequest: boolean = false;
    let thirdPagedRequest: boolean = false;
    sinon.stub(request, 'get').resolves({
      value: [
        {
          "Description": null,
          "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Sales"
        },
        {
          "Description": null,
          "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Travel Programs"
        }
      ]
    });
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/lists/GetByTitle('DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECOLLECTIONS')/RenderListDataAsStream`) > -1
        && opts.data.parameters.ViewXml.indexOf('<RowLimit Paged="TRUE">' + newBatchSize + '</RowLimit>') > -1) {
        if ((opts.url as string).indexOf('?Paged=TRUE') === -1) {
          firstPagedRequest = true;
          return {
            FilterLink: "?",
            FirstRow: 1,
            FolderPermissions: "0x7fffffffffffffff",
            ForceNoHierarchy: 1,
            HierarchyHasIndention: null,
            LastRow: 3,
            NextHref: "?Paged=TRUE&p_Title=Another%20Hub%20Sub%202&p_ID=32&PageFirstRow=4&View=00000000-0000-0000-0000-00000000000",
            Row: [{ "ID": "30", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/30_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F30%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/30_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/30_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "554", "Title": "Another Hub Root", "SiteUrl": "https://contoso.sharepoint.com/sites/AnotherHubRoot", "SiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "HubSiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "31", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/31_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F31%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/31_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/31_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "556", "Title": "Another Hub Sub 1", "SiteUrl": "https://contoso.sharepoint.com/sites/AnotherHubSub1", "SiteId": "{3A569D44-D3CD-45AB-9AB8-87675D18AF63}", "HubSiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "32", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/32_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F32%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/32_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/32_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "556", "Title": "Another Hub Sub 2", "SiteUrl": "https://contoso.sharepoint.com/sites/AnotherHubSub2", "SiteId": "{794FE8EC-458F-444B-A799-E179AB786784}", "HubSiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "TimeDeleted": "", "State": "", "State.": "" }],
            RowLimit: 3
          };
        }
        if ((opts.url as string).indexOf('?Paged=TRUE&p_Title=Another%20Hub%20Sub%202&p_ID=32&PageFirstRow=4&View=00000000-0000-0000-0000-00000000000') > -1) {
          secondPagedRequest = true;
          return {
            FilterLink: "?",
            FirstRow: 4,
            FolderPermissions: "0x7fffffffffffffff",
            ForceNoHierarchy: 1,
            HierarchyHasIndention: null,
            LastRow: 6,
            NextHref: "?Paged=TRUE&p_Title=Hub%20sub%204&p_ID=29&PageFirstRow=7&View=00000000-0000-0000-0000-00000000000",
            PrevHref: "?&&p_Title=Hub%20sub%201&&PageFirstRow=1&View=00000000-0000-0000-0000-000000000000",
            Row: [{ "ID": "25", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/25_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F25%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/25_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/25_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "518", "Title": "Hub sub 1", "SiteUrl": "https://contoso.sharepoint.com/sites/Hubsub1", "SiteId": "{83C2E5B0-DC64-4040-AB1F-A6A9A8169E46}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "28", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/28_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F28%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/28_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/28_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "550", "Title": "Hub sub 3", "SiteUrl": "https://contoso.sharepoint.com/sites/Hubsub3", "SiteId": "{5509F9AC-ECF8-488A-B960-BEDF4D8FB321}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "29", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/29_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F29%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/29_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/29_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "518", "Title": "Hub sub 4", "SiteUrl": "https://contoso.sharepoint.com/sites/Hubsub4", "SiteId": "{8AC9E1ED-29B8-4342-AF30-11F597731F8A}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }],
            RowLimit: 3
          };
        }
        if ((opts.url as string).indexOf('?Paged=TRUE&p_Title=Hub%20sub%204&p_ID=29&PageFirstRow=7&View=00000000-0000-0000-0000-00000000000') > -1) {
          thirdPagedRequest = true;
          return {
            FilterLink: "?",
            FirstRow: 7,
            FolderPermissions: "0x7fffffffffffffff",
            ForceNoHierarchy: 1,
            HierarchyHasIndention: null,
            LastRow: 8,
            PrevHref: "?Paged=TRUE&PagedPrev=TRUE&p_Title=Hub%20sub%20x&p_ID=27&PageFirstRow=4&View=00000000-0000-0000-0000-000000000000",
            Row: [{ "ID": "27", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/27_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F27%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/27_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/27_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "550", "Title": "Hub sub x", "SiteUrl": "https://contoso.sharepoint.com/sites/Hubsubx", "SiteId": "{DC0D0D79-1B0D-45A7-A8EE-7B97679B79DE}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "24", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/24_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F24%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/24_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/24_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "514", "Title": "Root Hub", "SiteUrl": "https://contoso.sharepoint.com/sites/RootHub", "SiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "HubSiteId": "{77F50C57-C40A-4666-83F5-D325567512BE}", "TimeDeleted": "", "State": "", "State.": "" }],
            RowLimit: 3
          };
        }
        throw 'Invalid request';
      }
      throw 'Invalid request';
    });
    await command.action(logger, { options: { debug: true, withAssociatedSites: true, output: 'json' } });
    assert.strictEqual((firstPagedRequest && secondPagedRequest && thirdPagedRequest), true);
  });

  it('lists hub sites, including associated sites, with all properties for JSON output', async () => {
    sinon.stub(request, 'get').resolves({
      value: [
        {
          "Description": null,
          "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Sales"
        },
        {
          "Description": null,
          "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Travel Programs"
        }
      ]
    });
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/lists/GetByTitle('DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECOLLECTIONS')/RenderListDataAsStream`) > -1
        && JSON.stringify(opts.data) === JSON.stringify({
          parameters: {
            ViewXml: "<View><Query><Where><And><And><IsNull><FieldRef Name=\"TimeDeleted\"/></IsNull><Neq><FieldRef Name=\"State\"/><Value Type='Integer'>0</Value></Neq></And><Neq><FieldRef Name=\"HubSiteId\"/><Value Type='Text'>{00000000-0000-0000-0000-000000000000}</Value></Neq></And></Where><OrderBy><FieldRef Name='Title' Ascending='true' /></OrderBy></Query><ViewFields><FieldRef Name=\"Title\"/><FieldRef Name=\"SiteUrl\"/><FieldRef Name=\"SiteId\"/><FieldRef Name=\"HubSiteId\"/></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit></View>",
            DatesInUtc: true
          }
        })
      ) {
        return {
          FilterLink: "?",
          FirstRow: 1,
          FolderPermissions: "0x7fffffffffffffff",
          ForceNoHierarchy: 1,
          HierarchyHasIndention: null,
          LastRow: 5,
          Row: [{
            "ID": "25",
            "PermMask": "0x7fffffffffffffff",
            "FSObjType": "0",
            "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3",
            "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/25_.000",
            "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F25%5F%2E000",
            "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/25_.000",
            "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/25_.000",
            "ItemChildCount": "0",
            "FolderChildCount": "0",
            "SMTotalSize": "494",
            "Title": "North",
            "SiteUrl": "https://contoso.sharepoint.com/sites/north",
            "HubSiteId": "{389D0D83-40BB-40AD-B92A-534B7CB37D0B}",
            "TimeDeleted": "",
            "State": "",
            "State.": ""
          }, {
            "ID": "28",
            "PermMask": "0x7fffffffffffffff",
            "FSObjType": "0",
            "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3",
            "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/28_.000",
            "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F28%5F%2E000",
            "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/28_.000",
            "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/28_.000",
            "ItemChildCount": "0",
            "FolderChildCount": "0",
            "SMTotalSize": "526",
            "Title": "South",
            "SiteUrl": "https://contoso.sharepoint.com/sites/south",
            "HubSiteId": "{389D0D83-40BB-40AD-B92A-534B7CB37D0B}",
            "TimeDeleted": "",
            "State": "",
            "State.": ""
          }, {
            "ID": "29",
            "PermMask": "0x7fffffffffffffff",
            "FSObjType": "0",
            "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3",
            "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/29_.000",
            "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F29%5F%2E000",
            "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/29_.000",
            "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/29_.000",
            "ItemChildCount": "0",
            "FolderChildCount": "0",
            "SMTotalSize": "494",
            "Title": "Europe",
            "SiteUrl": "https://contoso.sharepoint.com/sites/europe",
            "HubSiteId": "{B2C94CA1-0957-4BDD-B549-B7D365EDC10F}",
            "TimeDeleted": "",
            "State": "",
            "State.": ""
          }, {
            "ID": "27",
            "PermMask": "0x7fffffffffffffff",
            "FSObjType": "0",
            "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3",
            "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/27_.000",
            "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F27%5F%2E000",
            "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/27_.000",
            "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/27_.000",
            "ItemChildCount": "0",
            "FolderChildCount": "0",
            "SMTotalSize": "526",
            "Title": "Asia",
            "SiteUrl": "https://contoso.sharepoint.com/sites/asia",
            "HubSiteId": "{B2C94CA1-0957-4BDD-B549-B7D365EDC10F}",
            "TimeDeleted": "",
            "State": "",
            "State.": ""
          }, {
            "ID": "24",
            "PermMask": "0x7fffffffffffffff",
            "FSObjType": "0",
            "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3",
            "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/24_.000",
            "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F24%5F%2E000",
            "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/24_.000",
            "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/24_.000",
            "ItemChildCount": "0",
            "FolderChildCount": "0",
            "SMTotalSize": "490",
            "Title": "America",
            "SiteUrl": "https://contoso.sharepoint.com/sites/america",
            "HubSiteId": "{B2C94CA1-0957-4BDD-B549-B7D365EDC10F}",
            "TimeDeleted": "",
            "State": "",
            "State.": ""
          }],
          RowLimit: 100
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { withAssociatedSites: true, output: 'json' } });
    assert.strictEqual(JSON.stringify(log[0]), JSON.stringify([
      {
        "Description": null,
        "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
        "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
        "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
        "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
        "Targets": null,
        "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
        "Title": "Sales",
        "AssociatedSites": [
          {
            "Title": "North",
            "SiteUrl": "https://contoso.sharepoint.com/sites/north"
          },
          {
            "Title": "South",
            "SiteUrl": "https://contoso.sharepoint.com/sites/south"
          }
        ]
      },
      {
        "Description": null,
        "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
        "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
        "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
        "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
        "Targets": null,
        "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
        "Title": "Travel Programs",
        "AssociatedSites": [
          {
            "Title": "Europe",
            "SiteUrl": "https://contoso.sharepoint.com/sites/europe"
          },
          {
            "Title": "Asia",
            "SiteUrl": "https://contoso.sharepoint.com/sites/asia"
          },
          {
            "Title": "America",
            "SiteUrl": "https://contoso.sharepoint.com/sites/america"
          }
        ]
      }
    ]));
  });

  it('correctly handles empty result while retrieving associated sites in batches', async () => {
    // Cast the command class instance to any so we can set the private
    // property 'batchSize' to a small number for easier testing
    const newBatchSize = 3;
    (command as any).batchSize = newBatchSize;
    let firstPagedRequest: boolean = false;
    sinon.stub(request, 'get').resolves({
      value: [
        {
          "Description": null,
          "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Sales"
        },
        {
          "Description": null,
          "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Travel Programs"
        }
      ]
    });
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/lists/GetByTitle('DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECOLLECTIONS')/RenderListDataAsStream`) > -1
        && opts.data.parameters.ViewXml.indexOf('<RowLimit Paged="TRUE">' + newBatchSize + '</RowLimit>') > -1) {
        if ((opts.url as string).indexOf('?Paged=TRUE') === -1) {
          firstPagedRequest = true;
          return {
            FilterLink: "?",
            FirstRow: 1,
            FolderPermissions: "0x7fffffffffffffff",
            ForceNoHierarchy: 1,
            HierarchyHasIndention: null,
            LastRow: 0,
            Row: [],
            RowLimit: 3
          };
        }
        throw 'Invalid request';
      }
      throw 'Invalid request';
    });
    await command.action(logger, { options: { debug: true, withAssociatedSites: true } });
    assert.strictEqual(firstPagedRequest, true);
  });

  it('correctly handles error in the first batch of associated sites', async () => {
    const error = {
      error: {
        'odata.error': {
          code: '-1, Microsoft.SharePoint.Client.InvalidOperationException',
          message: {
            value: 'An error has occurred'
          }
        }
      }
    };

    // Cast the command class instance to any so we can set the private
    // property 'batchSize' to a small number for easier testing
    const newBatchSize = 3;
    (command as any).batchSize = newBatchSize;
    sinon.stub(request, 'get').resolves({
      value: [
        {
          "Description": null,
          "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Sales"
        },
        {
          "Description": null,
          "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Travel Programs"
        }
      ]
    });

    sinon.stub(request, 'post').rejects(error);

    await assert.rejects(command.action(logger, { options: { withAssociatedSites: true, output: 'json' } } as any),
      new CommandError('An error has occurred'));
  });

  it('correctly handles error in a subsequent batch of associated sites', async () => {
    const error = {
      error: {
        'odata.error': {
          code: '-1, Microsoft.SharePoint.Client.InvalidOperationException',
          message: {
            value: 'An error has occurred'
          }
        }
      }
    };

    // Cast the command class instance to any so we can set the private
    // property 'batchSize' to a small number for easier testing
    const newBatchSize = 3;
    (command as any).batchSize = newBatchSize;
    sinon.stub(request, 'get').resolves({
      value: [
        {
          "Description": null,
          "ID": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "389d0d83-40bb-40ad-b92a-534b7cb37d0b",
          "SiteUrl": "https://contoso.sharepoint.com/sites/Sales",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Sales"
        },
        {
          "Description": null,
          "ID": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "LogoUrl": "http://contoso.com/__siteIcon__.jpg",
          "SiteId": "b2c94ca1-0957-4bdd-b549-b7d365edc10f",
          "SiteUrl": "https://contoso.sharepoint.com/sites/travelprograms",
          "Targets": null,
          "TenantInstanceId": "00000000-0000-0000-0000-000000000000",
          "Title": "Travel Programs"
        }
      ]
    });

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/lists/GetByTitle('DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECOLLECTIONS')/RenderListDataAsStream`) > -1
        && opts.data.parameters.ViewXml.indexOf('<RowLimit Paged="TRUE">' + newBatchSize + '</RowLimit>') > -1) {
        if ((opts.url as string).indexOf('?Paged=TRUE') === -1) {
          return {
            FilterLink: "?",
            FirstRow: 1,
            FolderPermissions: "0x7fffffffffffffff",
            ForceNoHierarchy: 1,
            HierarchyHasIndention: null,
            LastRow: 3,
            NextHref: "?Paged=TRUE&p_Title=Another%20Hub%20Sub%202&p_ID=32&PageFirstRow=4&View=00000000-0000-0000-0000-00000000000",
            Row: [{ "ID": "30", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/30_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F30%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/30_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/30_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "554", "Title": "Another Hub Root", "SiteUrl": "https://contoso.sharepoint.com/sites/AnotherHubRoot", "SiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "HubSiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "31", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/31_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F31%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/31_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/31_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "556", "Title": "Another Hub Sub 1", "SiteUrl": "https://contoso.sharepoint.com/sites/AnotherHubSub1", "SiteId": "{3A569D44-D3CD-45AB-9AB8-87675D18AF63}", "HubSiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "TimeDeleted": "", "State": "", "State.": "" }, { "ID": "32", "PermMask": "0x7fffffffffffffff", "FSObjType": "0", "ContentTypeId": "0x0100F14AFE642BCF6347882B6B8ABA3E15E3", "FileRef": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/32_.000", "FileRef.urlencode": "%2FLists%2FDO%5FNOT%5FDELETE%5FSPLIST%5FTENANTADMIN%5FAGGREGATED%5FSITECO%2F32%5F%2E000", "FileRef.urlencodeasurl": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/32_.000", "FileRef.urlencoding": "/Lists/DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECO/32_.000", "ItemChildCount": "0", "FolderChildCount": "0", "SMTotalSize": "556", "Title": "Another Hub Sub 2", "SiteUrl": "https://contoso.sharepoint.com/sites/AnotherHubSub2", "SiteId": "{794FE8EC-458F-444B-A799-E179AB786784}", "HubSiteId": "{E9E2090B-1F51-47EA-8466-75D5A244217E}", "TimeDeleted": "", "State": "", "State.": "" }],
            RowLimit: 3
          };
        }
        if ((opts.url as string).indexOf('?Paged=TRUE&p_Title=Another%20Hub%20Sub%202&p_ID=32&PageFirstRow=4&View=00000000-0000-0000-0000-00000000000') > -1) {
          throw error;
        }

        throw 'Invalid request';
      }
      throw 'Invalid request';
    });
    await assert.rejects(command.action(logger, { options: { debug: true, withAssociatedSites: true, output: 'json' } } as any),
      new CommandError('An error has occurred'));
  });
});
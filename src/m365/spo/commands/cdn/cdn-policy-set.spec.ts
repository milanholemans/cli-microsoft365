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
import command from './cdn-policy-set.js';

describe(commands.CDN_POLICY_SET, () => {
  let log: string[];
  let logger: Logger;
  let commandInfo: CommandInfo;
  let requests: any[];

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    sinon.stub(spo, 'getRequestDigest').resolves({
      FormDigestValue: 'abc',
      FormDigestTimeoutSeconds: 1800,
      FormDigestExpiresAt: new Date(),
      WebFullUrl: 'https://contoso.sharepoint.com'
    });
    auth.connection.active = true;
    auth.connection.spoUrl = 'https://contoso.sharepoint.com';
    auth.connection.spoTenantId = 'abc';
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);

      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1) {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] &&
          opts.data) {
          if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetTenantCdnPolicy" Id="12" ObjectPathId="8"><Parameters><Parameter Type="Enum">0</Parameter><Parameter Type="Enum">0</Parameter><Parameter Type="String">WOFF</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="8" Name="abc" /></ObjectPaths></Request>`) {
            return JSON.stringify([{ "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": null, "TraceCorrelationId": "4456299e-d09e-4000-ae61-ddde716daa27" }, 31, { "IsNull": false }, 33, { "IsNull": false }, 35, { "IsNull": false }]);
          }
        }
      }

      throw 'Invalid request';
    });
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
    requests = [];
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
    auth.connection.spoUrl = undefined;
    auth.connection.spoTenantId = undefined;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.CDN_POLICY_SET);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('sets IncludeFileExtensions CDN policy on the public CDN when Public type specified', async () => {
    await command.action(logger, { options: { debug: true, policy: 'IncludeFileExtensions', value: 'WOFF', cdnType: 'Public' } });
    let setRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf('/_vti_bin/client.svc/ProcessQuery') > -1 &&
        r.headers['X-RequestDigest'] &&
        r.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetTenantCdnPolicy" Id="12" ObjectPathId="8"><Parameters><Parameter Type="Enum">0</Parameter><Parameter Type="Enum">0</Parameter><Parameter Type="String">WOFF</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="8" Name="abc" /></ObjectPaths></Request>`) {
        setRequestIssued = true;
      }
    });
    assert(setRequestIssued);
  });

  it('sets IncludeFileExtensions CDN policy on the private CDN when Private type specified', async () => {
    await assert.rejects(command.action(logger, { options: { debug: true, policy: 'IncludeFileExtensions', value: 'WOFF', cdnType: 'Private' } }));
    let setRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf('/_vti_bin/client.svc/ProcessQuery') > -1 &&
        r.headers['X-RequestDigest'] &&
        r.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetTenantCdnPolicy" Id="12" ObjectPathId="8"><Parameters><Parameter Type="Enum">1</Parameter><Parameter Type="Enum">0</Parameter><Parameter Type="String">WOFF</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="8" Name="abc" /></ObjectPaths></Request>`) {
        setRequestIssued = true;
      }
    });

    assert(setRequestIssued);
  });

  it('sets IncludeFileExtensions CDN policy on the public CDN when no type specified', async () => {
    await command.action(logger, { options: { debug: true, policy: 'IncludeFileExtensions', value: 'WOFF' } });
    let setRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf('/_vti_bin/client.svc/ProcessQuery') > -1 &&
        r.headers['X-RequestDigest'] &&
        r.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetTenantCdnPolicy" Id="12" ObjectPathId="8"><Parameters><Parameter Type="Enum">0</Parameter><Parameter Type="Enum">0</Parameter><Parameter Type="String">WOFF</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="8" Name="abc" /></ObjectPaths></Request>`) {
        setRequestIssued = true;
      }
    });

    assert(setRequestIssued);
  });

  it('sets ExcludeRestrictedSiteClassifications CDN policy on the public CDN when no type specified', async () => {
    await assert.rejects(command.action(logger, { options: { policy: 'ExcludeRestrictedSiteClassifications', value: 'foo' } }));
    let setRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf('/_vti_bin/client.svc/ProcessQuery') > -1 &&
        r.headers['X-RequestDigest'] &&
        r.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetTenantCdnPolicy" Id="12" ObjectPathId="8"><Parameters><Parameter Type="Enum">0</Parameter><Parameter Type="Enum">1</Parameter><Parameter Type="String">foo</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="8" Name="abc" /></ObjectPaths></Request>`) {
        setRequestIssued = true;
      }
    });

    assert(setRequestIssued);
  });

  it('escapes XML in user input', async () => {
    sinonUtil.restore(request.post);
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);

      if ((opts.url as string).indexOf('/_api/contextinfo') > -1) {
        if (opts.headers &&
          opts.headers.accept &&
          (opts.headers.accept as string).indexOf('application/json') === 0) {
          return { FormDigestValue: 'abc' };
        }
      }

      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1) {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] &&
          opts.data) {
          if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetTenantCdnPolicy" Id="12" ObjectPathId="8"><Parameters><Parameter Type="Enum">0</Parameter><Parameter Type="Enum">0</Parameter><Parameter Type="String">&lt;WOFF</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="8" Name="abc" /></ObjectPaths></Request>`) {
            return JSON.stringify([{ "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": null, "TraceCorrelationId": "4456299e-d09e-4000-ae61-ddde716daa27" }, 31, { "IsNull": false }, 33, { "IsNull": false }, 35, { "IsNull": false }]);
          }
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { policy: 'IncludeFileExtensions', value: '<WOFF' } });
    assert.strictEqual(log.length, 0);
  });

  it('correctly handles an error when setting tenant CDN policy value', async () => {
    sinonUtil.restore(request.post);
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_api/contextinfo') > -1) {
        if (opts.headers &&
          opts.headers.accept &&
          (opts.headers.accept as string).indexOf('application/json') === 0) {
          return { FormDigestValue: 'abc' };
        }
      }

      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1) {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] &&
          opts.data) {
          if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetTenantCdnPolicy" Id="12" ObjectPathId="8"><Parameters><Parameter Type="Enum">0</Parameter><Parameter Type="Enum">0</Parameter><Parameter Type="String">&lt;WOFF</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="8" Name="abc" /></ObjectPaths></Request>`) {
            return JSON.stringify([
              {
                "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": {
                  "ErrorMessage": "An error has occurred", "ErrorValue": null, "TraceCorrelationId": "965d299e-a0c6-4000-8546-cc244881a129", "ErrorCode": -1, "ErrorTypeName": "Microsoft.SharePoint.PublicCdn.TenantCdnAdministrationException"
                }, "TraceCorrelationId": "965d299e-a0c6-4000-8546-cc244881a129"
              }
            ]);
          }
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { policy: 'IncludeFileExtensions', value: '<WOFF' } } as any),
      new CommandError('An error has occurred'));
  });

  it('requires CDN policy name', () => {
    const options = command.options;
    let requiresCdnPolicyName = false;
    options.forEach(o => {
      if (o.option.indexOf('<policy>') > -1) {
        requiresCdnPolicyName = true;
      }
    });
    assert(requiresCdnPolicyName);
  });

  it('requires CDN policy value', () => {
    const options = command.options;
    let requiresCdnPolicyValue = false;
    options.forEach(o => {
      if (o.option.indexOf('<value>') > -1) {
        requiresCdnPolicyValue = true;
      }
    });
    assert(requiresCdnPolicyValue);
  });

  it('accepts Public SharePoint Online CDN type', async () => {
    const actual = await command.validate({ options: { cdnType: 'Public', policy: 'IncludeFileExtensions', value: 'CSS,EOT,GIF,ICO,JPEG,JPG,JS,MAP,PNG,SVG,TTF,WOFF,JSON' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('accepts Private SharePoint Online CDN type', async () => {
    const actual = await command.validate({ options: { cdnType: 'Private', policy: 'IncludeFileExtensions', value: 'CSS,EOT,GIF,ICO,JPEG,JPG,JS,MAP,PNG,SVG,TTF,WOFF,JSON' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('rejects invalid SharePoint Online CDN type', async () => {
    const type = 'foo';
    const actual = await command.validate({ options: { cdnType: type, policy: 'IncludeFileExtensions', value: 'CSS,EOT,GIF,ICO,JPEG,JPG,JS,MAP,PNG,SVG,TTF,WOFF,JSON' } }, commandInfo);
    assert.strictEqual(actual, `${type} is not a valid CDN type. Allowed values are Public|Private`);
  });

  it('doesn\'t fail validation if the optional type option not specified', async () => {
    const actual = await command.validate({ options: { policy: 'IncludeFileExtensions', value: 'CSS,EOT,GIF,ICO,JPEG,JPG,JS,MAP,PNG,SVG,TTF,WOFF,JSON' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('accepts IncludeFileExtensions SharePoint Online CDN policy', async () => {
    const actual = await command.validate({ options: { policy: 'IncludeFileExtensions', value: 'CSS,EOT,GIF,ICO,JPEG,JPG,JS,MAP,PNG,SVG,TTF,WOFF,JSON' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('accepts ExcludeRestrictedSiteClassifications SharePoint Online CDN policy', async () => {
    const actual = await command.validate({ options: { policy: 'ExcludeRestrictedSiteClassifications', value: 'Public' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('rejects invalid SharePoint Online CDN policy', async () => {
    const policy = 'foo';
    const actual = await command.validate({ options: { policy: policy, value: 'bar' } }, commandInfo);
    assert.strictEqual(actual, `${policy} is not a valid CDN policy. Allowed values are IncludeFileExtensions|ExcludeRestrictedSiteClassifications`);
  });
});

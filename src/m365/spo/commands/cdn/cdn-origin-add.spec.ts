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
import command from './cdn-origin-add.js';

describe(commands.CDN_ORIGIN_ADD, () => {
  let log: string[];
  let logger: Logger;
  let commandInfo: CommandInfo;
  let requests: any[];

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    sinon.stub(spo, 'getRequestDigest').resolves(
      {
        FormDigestValue: 'abc',
        FormDigestTimeoutSeconds: 1800,
        FormDigestExpiresAt: new Date(),
        WebFullUrl: 'https://contoso.sharepoint.com'
      }
    );
    auth.connection.active = true;
    auth.connection.spoUrl = 'https://contoso.sharepoint.com';
    auth.connection.spoTenantId = 'abc';
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);

      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1) {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] &&
          opts.data) {
          if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="AddTenantCdnOrigin" Id="27" ObjectPathId="23"><Parameters><Parameter Type="Enum">0</Parameter><Parameter Type="String">*/cdn</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="23" Name="abc" /></ObjectPaths></Request>`) {
            return JSON.stringify([
              {
                "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": null, "TraceCorrelationId": "a05d299e-0036-4000-8546-cfc42dc07fd2"
              }, 42, [
                "*\u002fMASTERPAGE", "*\u002fSTYLE LIBRARY", "*\u002fCLIENTSIDEASSETS", "*\u002fCDN (configuration pending)"
              ]
            ]);
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
    assert.strictEqual(command.name, commands.CDN_ORIGIN_ADD);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('sets CDN origin on the public CDN when Public type specified', async () => {
    await command.action(logger, { options: { debug: true, origin: '*/cdn', type: 'Public' } });
    let setRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf('/_vti_bin/client.svc/ProcessQuery') > -1 &&
        r.headers['X-RequestDigest'] &&
        r.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="AddTenantCdnOrigin" Id="27" ObjectPathId="23"><Parameters><Parameter Type="Enum">0</Parameter><Parameter Type="String">*/cdn</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="23" Name="abc" /></ObjectPaths></Request>`) {
        setRequestIssued = true;
      }
    });

    assert(setRequestIssued);
  });

  it('sets CDN origin on the private CDN when Private type specified', async () => {
    await assert.rejects(command.action(logger, { options: { debug: true, origin: '*/cdn', type: 'Private' } }));
    let setRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf('/_vti_bin/client.svc/ProcessQuery') > -1 &&
        r.headers['X-RequestDigest'] &&
        r.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="AddTenantCdnOrigin" Id="27" ObjectPathId="23"><Parameters><Parameter Type="Enum">1</Parameter><Parameter Type="String">*/cdn</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="23" Name="abc" /></ObjectPaths></Request>`) {
        setRequestIssued = true;
      }
    });

    assert(setRequestIssued);
  });

  it('sets CDN origin on the public CDN when no type specified', async () => {
    await command.action(logger, { options: { origin: '*/cdn' } });
    let setRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf('/_vti_bin/client.svc/ProcessQuery') > -1 &&
        r.headers['X-RequestDigest'] &&
        r.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="AddTenantCdnOrigin" Id="27" ObjectPathId="23"><Parameters><Parameter Type="Enum">0</Parameter><Parameter Type="String">*/cdn</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="23" Name="abc" /></ObjectPaths></Request>`) {
        setRequestIssued = true;
      }
    });

    assert(setRequestIssued);
  });

  it('correctly handles trying to set CDN origin that has already been set', async () => {
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
          if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="AddTenantCdnOrigin" Id="27" ObjectPathId="23"><Parameters><Parameter Type="Enum">0</Parameter><Parameter Type="String">*/cdn</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="23" Name="abc" /></ObjectPaths></Request>`) {
            return JSON.stringify([
              {
                "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": {
                  "ErrorMessage": "The library is already registered as a CDN origin.", "ErrorValue": null, "TraceCorrelationId": "965d299e-a0c6-4000-8546-cc244881a129", "ErrorCode": -1, "ErrorTypeName": "Microsoft.SharePoint.PublicCdn.TenantCdnAdministrationException"
                }, "TraceCorrelationId": "965d299e-a0c6-4000-8546-cc244881a129"
              }
            ]);
          }
        }
      }

      throw 'Invalid request';
    });
    await assert.rejects(command.action(logger, { options: { debug: true, origin: '*/cdn', type: 'Public' } } as any),
      new CommandError('The library is already registered as a CDN origin.'));
  });

  it('correctly handles random API error', async () => {
    sinonUtil.restore(request.post);
    sinon.stub(request, 'post').rejects(new Error('An error has occurred'));
    await assert.rejects(command.action(logger, { options: { debug: true, origin: '*/cdn', type: 'Public' } } as any),
      new CommandError('An error has occurred'));
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
          if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="AddTenantCdnOrigin" Id="27" ObjectPathId="23"><Parameters><Parameter Type="Enum">0</Parameter><Parameter Type="String">&lt;*/CDN&gt;</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="23" Name="abc" /></ObjectPaths></Request>`) {
            return JSON.stringify([
              {
                "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": null, "TraceCorrelationId": "a05d299e-0036-4000-8546-cfc42dc07fd2"
              }, 42, [
                "*\u002fMASTERPAGE", "*\u002fSTYLE LIBRARY", "*\u002fCLIENTSIDEASSETS", "*\u002fCDN (configuration pending)"
              ]
            ]);
          }
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, origin: '<*/CDN>' } });
    let isDone = false;
    log.forEach(l => {
      if (l && typeof l === 'string' && l.indexOf('DONE')) {
        isDone = true;
      }
    });

    assert(isDone);
  });

  it('requires CDN origin name', () => {
    const options = command.options;
    let requiresCdnOriginName = false;
    options.forEach(o => {
      if (o.option.indexOf('<origin>') > -1) {
        requiresCdnOriginName = true;
      }
    });
    assert(requiresCdnOriginName);
  });

  it('accepts Public SharePoint Online CDN type', async () => {
    const actual = await command.validate({ options: { type: 'Public', origin: '*/CDN' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('accepts Private SharePoint Online CDN type', async () => {
    const actual = await command.validate({ options: { type: 'Private', origin: '*/CDN' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('rejects invalid SharePoint Online CDN type', async () => {
    const type = 'foo';
    const actual = await command.validate({ options: { type: type, origin: '*/CDN' } }, commandInfo);
    assert.strictEqual(actual, `${type} is not a valid CDN type. Allowed values are Public|Private`);
  });

  it('doesn\'t fail validation if the optional type option not specified', async () => {
    const actual = await command.validate({ options: { origin: '*/CDN' } }, commandInfo);
    assert.strictEqual(actual, true);
  });
});

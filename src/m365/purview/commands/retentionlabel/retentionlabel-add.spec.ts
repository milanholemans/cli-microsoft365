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
import command from './retentionlabel-add.js';

describe(commands.RETENTIONLABEL_ADD, () => {
  const invalid = 'invalid';
  const displayName = 'some label';
  const behaviorDuringRetentionPeriod = 'retain';
  const actionAfterRetentionPeriod = 'delete';
  const retentionDuration = 365;
  const retentionTrigger = 'dateLabeled';
  const defaultRecordBehavior = 'startLocked';
  const descriptionForUsers = 'Description for users';
  const descriptionForAdmins = 'Description for admins';
  const labelToBeApplied = 'another label';
  const eventTypeName = 'Retention Event Type';
  const eventTypeId = '81fa91bd-66cd-4c6c-b0cb-71f37210dc74';

  const requestResponse = {
    displayName: "some label",
    descriptionForAdmins: "Description for admins",
    descriptionForUsers: "Description for users",
    isInUse: false,
    retentionTrigger: "dateLabeled",
    behaviorDuringRetentionPeriod: "retain",
    actionAfterRetentionPeriod: "delete",
    createdDateTime: "2022-12-21T09:28:37Z",
    lastModifiedDateTime: "2022-12-21T09:28:37Z",
    labelToBeApplied: "another label",
    defaultRecordBehavior: "startLocked",
    id: "f7e05955-210b-4a8e-a5de-3c64cfa6d9be",
    retentionDuration: {
      days: 365
    },
    createdBy: {
      user: {
        id: null,
        displayName: "John Doe"
      }
    },
    lastModifiedBy: {
      user: {
        id: null,
        displayName: "John Doe"
      }
    },
    dispositionReviewStages: []
  };

  const eventTypeResponse = {
    value: [
      {
        displayName: "Retention Event Type",
        description: "",
        createdDateTime: "2023-02-02T15:47:54Z",
        lastModifiedDateTime: "2023-02-02T15:47:54Z",
        id: "81fa91bd-66cd-4c6c-b0cb-71f37210dc74",
        createdBy: {
          user: {
            id: "36155f4e-bdbd-4101-ba20-5e78f5fba9a9",
            displayName: null
          }
        },
        lastModifiedBy: {
          user: {
            id: "36155f4e-bdbd-4101-ba20-5e78f5fba9a9",
            displayName: null
          }
        }
      }
    ]
  };

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
    auth.connection.accessTokens[(command as any).resource] = {
      accessToken: 'abc',
      expiresOn: new Date()
    };
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
      request.post,
      request.get
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
    auth.connection.accessTokens = {};
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.RETENTIONLABEL_ADD);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if retentionDuration is not a number', async () => {
    const actual = await command.validate({
      options: {
        displayName: displayName,
        behaviorDuringRetentionPeriod: behaviorDuringRetentionPeriod,
        actionAfterRetentionPeriod: actionAfterRetentionPeriod,
        retentionDuration: invalid
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('validates for a correct input with id', async () => {
    const actual = await command.validate({
      options: {
        displayName: displayName,
        behaviorDuringRetentionPeriod: behaviorDuringRetentionPeriod,
        actionAfterRetentionPeriod: actionAfterRetentionPeriod,
        retentionDuration: retentionDuration,
        retentionTrigger: retentionTrigger,
        defaultRecordBehavior: defaultRecordBehavior,
        descriptionForUsers: descriptionForUsers,
        descriptionForAdmins: descriptionForAdmins,
        labelToBeApplied: labelToBeApplied
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('rejects invalid behaviorDuringRetentionPeriod', async () => {
    const actual = await command.validate({
      options: {
        displayName: displayName,
        behaviorDuringRetentionPeriod: invalid,
        actionAfterRetentionPeriod: actionAfterRetentionPeriod,
        retentionDuration: retentionDuration
      }
    }, commandInfo);
    assert.strictEqual(actual, `${invalid} is not a valid behavior of a document with the label. Allowed values are doNotRetain, retain, retainAsRecord, retainAsRegulatoryRecord`);
  });

  it('rejects invalid actionAfterRetentionPeriod', async () => {
    const actual = await command.validate({
      options: {
        displayName: displayName,
        behaviorDuringRetentionPeriod: behaviorDuringRetentionPeriod,
        actionAfterRetentionPeriod: invalid,
        retentionDuration: retentionDuration
      }
    }, commandInfo);
    assert.strictEqual(actual, `${invalid} is not a valid action to take on a document with the label. Allowed values are none, delete, startDispositionReview`);
  });

  it('rejects invalid retentionTrigger', async () => {
    const actual = await command.validate({
      options: {
        displayName: displayName,
        behaviorDuringRetentionPeriod: behaviorDuringRetentionPeriod,
        actionAfterRetentionPeriod: actionAfterRetentionPeriod,
        retentionDuration: retentionDuration,
        retentionTrigger: invalid
      }
    }, commandInfo);
    assert.strictEqual(actual, `${invalid} is not a valid action retention duration calculation. Allowed values are dateLabeled, dateCreated, dateModified, dateOfEvent`);
  });

  it('rejects invalid defaultRecordBehavior', async () => {
    const actual = await command.validate({
      options: {
        displayName: displayName,
        behaviorDuringRetentionPeriod: behaviorDuringRetentionPeriod,
        actionAfterRetentionPeriod: actionAfterRetentionPeriod,
        retentionDuration: retentionDuration,
        defaultRecordBehavior: invalid
      }
    }, commandInfo);
    assert.strictEqual(actual, `${invalid} is not a valid state of a record label. Allowed values are startLocked, startUnlocked`);
  });

  it('throws error when no retention event type found with name', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url === `https://graph.microsoft.com/beta/security/triggerTypes/retentionEventTypes`)) {
        return ({ "value": [] });
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        displayName: displayName,
        behaviorDuringRetentionPeriod: behaviorDuringRetentionPeriod,
        actionAfterRetentionPeriod: actionAfterRetentionPeriod,
        retentionDuration: retentionDuration,
        retentionTrigger: "dateOfEvent",
        eventTypeName: eventTypeName
      }
    }), new CommandError(`The specified retention event type '${eventTypeName}' does not exist.`));
  });

  it('adds retention label with all options', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/beta/security/labels/retentionLabels`) {
        return requestResponse;
      }

      return 'Invalid Request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        verbose: true,
        displayName: displayName,
        behaviorDuringRetentionPeriod: behaviorDuringRetentionPeriod,
        actionAfterRetentionPeriod: actionAfterRetentionPeriod,
        retentionDuration: retentionDuration,
        retentionTrigger: retentionTrigger,
        defaultRecordBehavior: defaultRecordBehavior,
        descriptionForUsers: descriptionForUsers,
        descriptionForAdmins: descriptionForAdmins,
        labelToBeApplied: labelToBeApplied
      }
    });

    assert(loggerLogSpy.calledWith(requestResponse));
  });

  it('adds retention label with all options and eventTypeName', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url === `https://graph.microsoft.com/beta/security/triggerTypes/retentionEventTypes`)) {
        return (eventTypeResponse);
      }

      throw 'Invalid request';
    });

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/beta/security/labels/retentionLabels`) {
        return requestResponse;
      }

      return 'Invalid Request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        verbose: true,
        displayName: displayName,
        behaviorDuringRetentionPeriod: behaviorDuringRetentionPeriod,
        actionAfterRetentionPeriod: actionAfterRetentionPeriod,
        retentionDuration: retentionDuration,
        retentionTrigger: "dateOfEvent",
        defaultRecordBehavior: defaultRecordBehavior,
        descriptionForUsers: descriptionForUsers,
        descriptionForAdmins: descriptionForAdmins,
        labelToBeApplied: labelToBeApplied,
        eventTypeName: eventTypeName
      }
    });

    assert(loggerLogSpy.calledWith(requestResponse));
  });

  it('adds retention label with all options and eventTypeId', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/beta/security/labels/retentionLabels`) {
        return requestResponse;
      }

      return 'Invalid Request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        verbose: true,
        displayName: displayName,
        behaviorDuringRetentionPeriod: behaviorDuringRetentionPeriod,
        actionAfterRetentionPeriod: actionAfterRetentionPeriod,
        retentionDuration: retentionDuration,
        retentionTrigger: "dateOfEvent",
        defaultRecordBehavior: defaultRecordBehavior,
        descriptionForUsers: descriptionForUsers,
        descriptionForAdmins: descriptionForAdmins,
        labelToBeApplied: labelToBeApplied,
        eventTypeId: eventTypeId
      }
    });

    assert(loggerLogSpy.calledWith(requestResponse));
  });

  it('correctly handles random API error', async () => {
    sinon.stub(request, 'post').callsFake(() => { throw 'An error has occurred'; });

    await assert.rejects(command.action(logger, {
      options: {
        displayName: displayName,
        behaviorDuringRetentionPeriod: behaviorDuringRetentionPeriod,
        actionAfterRetentionPeriod: actionAfterRetentionPeriod,
        retentionDuration: retentionDuration
      }
    }), new CommandError("An error has occurred"));
  });
});
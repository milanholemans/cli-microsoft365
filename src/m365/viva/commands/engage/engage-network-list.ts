import { Logger } from '../../../../cli/Logger.js';
import GlobalOptions from '../../../../GlobalOptions.js';
import request, { CliRequestOptions } from '../../../../request.js';
import VivaEngageCommand from '../../../base/VivaEngageCommand.js';
import commands from '../../commands.js';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  includeSuspended?: boolean;
  withSuspended?: boolean;
}

class VivaEngageNetworkListCommand extends VivaEngageCommand {
  public get name(): string {
    return commands.ENGAGE_NETWORK_LIST;
  }

  public get description(): string {
    return 'Returns a list of networks to which the current user has access';
  }

  public defaultProperties(): string[] | undefined {
    return ['id', 'name', 'email', 'community', 'permalink', 'web_url'];
  }

  constructor() {
    super();

    this.#initTelemetry();
    this.#initOptions();
  }

  #initTelemetry(): void {
    this.telemetry.push((args: CommandArgs) => {
      Object.assign(this.telemetryProperties, {
        includeSuspended: args.options.includeSuspended,
        withSuspended: args.options.withSuspended
      });
    });
  }

  #initOptions(): void {
    this.options.unshift(
      {
        option: '--includeSuspended'
      },
      {
        option: '--withSuspended'
      }
    );
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    if (args.options.includeSuspended) {
      await this.warn(logger, `Parameter 'includeSuspended' is deprecated. Please use 'withSuspended' instead`);
    }

    const requestOptions: CliRequestOptions = {
      url: `${this.resource}/v1/networks/current.json`,
      headers: {
        accept: 'application/json;odata.metadata=none',
        'content-type': 'application/json;odata=nometadata'
      },
      responseType: 'json',
      data: {
        includeSuspended: (args.options.includeSuspended !== undefined && args.options.includeSuspended !== false) || (args.options.withSuspended !== undefined && args.options.withSuspended !== false)
      }
    };

    try {
      const res: any = await request.get(requestOptions);

      await logger.log(res);
    }
    catch (err: any) {
      this.handleRejectedODataJsonPromise(err);
    }
  }
}

export default new VivaEngageNetworkListCommand();
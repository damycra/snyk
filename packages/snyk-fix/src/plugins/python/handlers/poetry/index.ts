import * as debugLib from 'debug';
import * as ora from 'ora';
import * as chalk from 'chalk';
import * as poetryFix from '@snyk/fix-poetry';

import { EntityToFix, FixOptions } from '../../../../types';
import { PluginFixResponse } from '../../../types';
import { updateDependencies } from './update-dependencies';
import { SUPPORTED_HANDLER_TYPES } from '../../supported-handler-types';

const debug = debugLib('snyk-fix:python:Poetry');

export async function poetry(
  fixable: EntityToFix[],
  options: FixOptions,
): Promise<PluginFixResponse> {
  debug(`Preparing to fix ${fixable.length} Python Poetry projects`);
  const handlerResult: PluginFixResponse = {
    succeeded: [],
    failed: [],
    skipped: [],
  };

  await checkPoetrySupport(options);
  for (const [index, entity] of fixable.entries()) {
    const spinner = ora({ isSilent: options.quiet, stream: process.stdout });
    const spinnerMessage = `Fixing ${SUPPORTED_HANDLER_TYPES.POETRY} ${index +
      1}/${fixable.length}`;
    spinner.text = spinnerMessage;
    spinner.start();

    const { failed, succeeded, skipped } = await updateDependencies(
      entity,
      options,
    );
    handlerResult.succeeded.push(...succeeded);
    handlerResult.failed.push(...failed);
    handlerResult.skipped.push(...skipped);
    spinner.stop();
  }

  return handlerResult;
}

async function checkPoetrySupport(options: FixOptions): Promise<void> {
  const { version } = await poetryFix.isPoetryInstalled();

  const spinner = ora({ isSilent: options.quiet, stream: process.stdout });
  spinner.clear();
  spinner.text = 'Checking poetry version';
  spinner.indent = 2;
  spinner.start();

  if (!version) {
    spinner.stopAndPersist({
      text: chalk.hex('#EDD55E')(
        'Could not detect poetry version, proceeding anyway. Some operations may fail.',
      ),
      symbol: chalk.hex('#EDD55E')('⚠️'),
    });
    return;
  }

  const { supported, versions } = poetryFix.isPoetrySupportedVersion(version);
  if (!supported) {
    const spinnerMessage = ` ${version} poetry version detected. Currently the following poetry versions are supported: ${versions.join(
      ',',
    )}`;
    spinner.stopAndPersist({
      text: chalk.hex('#EDD55E')(spinnerMessage),
      symbol: chalk.hex('#EDD55E')('⚠️'),
    });
  } else {
    spinner.stop();
  }
}

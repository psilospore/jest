/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {GlobalConfig} from 'types/Config';
import type {AggregatedResult} from 'types/TestResult';
import type {Context} from 'types/Context';

import path from 'path';
import util from 'util';
import notifier from 'node-notifier';
import BaseReporter from './base_reporter';
import type {TestSchedulerContext} from '../test_scheduler';

const isDarwin = process.platform === 'darwin';

const icon = path.resolve(__dirname, '../assets/jest_logo.png');

export default class NotifyReporter extends BaseReporter {
  _startRun: (globalConfig: GlobalConfig) => *;
  _globalConfig: GlobalConfig;
  _context: TestSchedulerContext;
  constructor(
    globalConfig: GlobalConfig,
    startRun: (globalConfig: GlobalConfig) => *,
    context: TestSchedulerContext,
  ) {
    super();
    this._globalConfig = globalConfig;
    this._startRun = startRun;
    this._context = context;
  }

  onRunComplete(contexts: Set<Context>, result: AggregatedResult): void {
    const success =
      result.numFailedTests === 0 && result.numRuntimeErrorTestSuites === 0;

    const notifyMode = this._globalConfig.notifyMode;
    const statusChanged =
      this._context.previousSuccess !== success || this._context.firstRun;

    const successChange =
      (notifyMode === 'change' && statusChanged && success) ||
      (notifyMode === 'success-change' && success) ||
      (notifyMode === 'success-change' && statusChanged);
    const failureChange =
      (notifyMode === 'change' && statusChanged && !success) ||
      (notifyMode === 'failure-change' && !success) ||
      (notifyMode === 'failure-change' && statusChanged);

    if (
      success &&
      (notifyMode === 'always' || notifyMode === 'success' || successChange)
    ) {
      const title = util.format('%d%% Passed', 100);
      const message = util.format(
        (isDarwin ? '\u2705 ' : '') + '%d tests passed',
        result.numPassedTests,
      );

      notifier.notify({icon, message, title});
      this._context.previousSuccess = true;
      this._context.firstRun = false;
    } else if (
      !success &&
      (notifyMode === 'always' || notifyMode === 'failure' || failureChange)
    ) {
      const failed = result.numFailedTests / result.numTotalTests;

      const title = util.format(
        '%d%% Failed',
        Math.ceil(Number.isNaN(failed) ? 0 : failed * 100),
      );
      const message = util.format(
        (isDarwin ? '\u26D4\uFE0F ' : '') + '%d of %d tests failed',
        result.numFailedTests,
        result.numTotalTests,
      );

      const restartAnswer = 'Run again';
      const quitAnswer = 'Exit tests';
      notifier.notify(
        {
          actions: [restartAnswer, quitAnswer],
          closeLabel: 'Close',
          icon,
          message,
          title,
        },
        (err, _, metadata) => {
          if (err || !metadata) {
            return;
          }
          if (metadata.activationValue === quitAnswer) {
            process.exit(0);
            return;
          }
          if (metadata.activationValue === restartAnswer) {
            this._startRun(this._globalConfig);
          }
        },
      );
      this._context.previousSuccess = false;
      this._context.firstRun = false;
    }
  }
}

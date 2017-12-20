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

const isDarwin = process.platform === 'darwin';

const icon = path.resolve(__dirname, '../assets/jest_logo.png');

export default class NotifyReporter extends BaseReporter {
  _startRun: (globalConfig: GlobalConfig) => *;
  _globalConfig: GlobalConfig;
  _previousSuccess: boolean;

  constructor(
    globalConfig: GlobalConfig,
    startRun: (globalConfig: GlobalConfig) => *,
  ) {
    super();
    this._globalConfig = globalConfig;
    this._startRun = startRun;
    this._previousSuccess = false;
    this._firstRun = true;
  }

  onRunComplete(contexts: Set<Context>, result: AggregatedResult): void {
    const success =
      result.numFailedTests === 0 && result.numRuntimeErrorTestSuites === 0;

    if (
      success &&
      (this._globalConfig === 'always' ||
        this._globalConfig === 'success' ||
        (this._globalConfig === 'change' &&
          (!this._previousSuccess || this._firstRun)))
    ) {
      const title = util.format('%d%% Passed', 100);
      const message = util.format(
        (isDarwin ? '\u2705 ' : '') + '%d tests passed',
        result.numPassedTests,
      );

      notifier.notify({icon, message, title});
      this._previousSuccess = true;
      this._firstRun = false;
    } else if (
      !success &&
      (this._globalConfig === 'always' ||
        this._globalConfig === 'failure' ||
        (this._globalConfig === 'change' &&
          (this._previousSuccess || this._firstRun)))
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
      this._previousSuccess = false;
      this._firstRun = false;
    }
  }
}

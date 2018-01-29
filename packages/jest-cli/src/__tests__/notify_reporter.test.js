/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import TestScheduler from '../test_scheduler';
import NotifyReporter from '../reporters/notify_reporter';
import type {TestSchedulerContext} from '../test_scheduler';

const SUCCESS_ICON_PATH = '/assets/jest_logo.png';
const FAILURE_ICON_PATH = 'TODO';

jest.mock('../reporters/default_reporter');
jest.mock('node-notifier', () => ({
  notify: jest.fn(),
}));

const initialContext: TestSchedulerContext = {
  firstRun: true,
  previousSuccess: false,
};

const aggregatedResultsSuccess: AggregatedResult = {
  numFailedTestSuites: 0,
  numFailedTests: 0,
  numPassedTestSuites: 1,
  numPassedTests: 3,
  numRuntimeErrorTestSuites: 0,
  numTotalTestSuites: 1,
  numTotalTests: 3,
  success: true,
};

const iconDir = path => {
  if (path.endsWith(SUCCESS_ICON_PATH)) {
    return 'SUCCESS_ICON';
  } else if (path.endsWith(FAILURE_ICON_PATH)) {
    return 'FAILURE_ICON';
  } else {
    return 'ICON_NOT_FOUND';
  }
};

test('.addReporter() .removeReporter()', () => {
  const scheduler = new TestScheduler({}, {}, initialContext);
  const reporter = new NotifyReporter();
  scheduler.addReporter(reporter);
  expect(scheduler._dispatcher._reporters).toContain(reporter);
  scheduler.removeReporter(NotifyReporter);
  expect(scheduler._dispatcher._reporters).not.toContain(reporter);
});

test('test always', () => {
  const notify = require('node-notifier');

  const reporter = new NotifyReporter(
    {notify: true, notifyMode: 'always'},
    {},
    initialContext,
  );
  reporter.onRunComplete(new Set(), aggregatedResultsSuccess);
  expect(
    notify.notify.mock.calls.map(([{icon, message, title}]) => ({
      icon: iconDir(icon),
      message,
      title,
    })),
  ).toMatchSnapshot();
});

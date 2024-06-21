// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn, ChildProcessWithoutNullStreams, execSync } from 'child_process';
import { FatalError } from './exceptions';
import readline from 'readline';
import waitOn from 'wait-on';

function spawnChromeDriver(port: string) {
  const params = [`--port=${port}`, '--log-level=SEVERE', '--path=/'];
  try {
    execSync('hash chromedriver');
  } catch {
    throw new FatalError("Cannot find local chromedriver. Did you run 'npm i -g chromedriver'?");
  }
  return spawn('chromedriver', params);
}

let webdriverProcess: ChildProcessWithoutNullStreams | undefined;
export function shutdownWebdriver() {
  if (webdriverProcess) {
    webdriverProcess.kill();
    webdriverProcess = undefined;
  }
}

export async function startWebdriver(port: string = '9515'): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    webdriverProcess = spawnChromeDriver(port);
    webdriverProcess.on('error', error => {
      shutdownWebdriver();
      reject(error);
    });
    webdriverProcess.on('exit', () => {
      shutdownWebdriver();
      reject(new Error('Webdriver process exited too early'));
    });
    webdriverProcess.stdout.once('data', () => resolve());
    const errorReader = readline.createInterface({ input: webdriverProcess.stderr });
    errorReader.on('line', (line: string) => {
      // chromeDriver spams to the error stream on macOS
      // https://bugs.chromium.org/p/chromedriver/issues/detail?id=2909
      if (line.indexOf('Please call TIS/TSM in main thread!!!') === -1) {
        console.error(line);
      }
    });
  });
  await waitOn({
    resources: [`http-get://localhost:${port}/status`],
    timeout: 10_000,
  });
}

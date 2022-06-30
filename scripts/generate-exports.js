#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const path = require('path');
// This package exposes several APIs in different files. For each export we generate a separate file in the repository root
const publicExports = Object.keys(require('../package.json').exports);

publicExports.forEach(exportName => {
  const exportPath = './' + path.join('dist/', exportName);
  fs.writeFileSync(`${exportName}.js`, `module.exports = require('${exportPath}');`);
  fs.writeFileSync(`${exportName}.d.ts`, `export * from '${exportPath}';export { default } from '${exportPath}';`);
});

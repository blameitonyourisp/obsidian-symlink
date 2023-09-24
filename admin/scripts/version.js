// Copyright (c) 2023 James Reid. All rights reserved.
//
// This source code file is licensed under the terms of the MIT license, a copy
// of which may be found in the LICENSE.md file in the root of this repository.
//
// For a template copy of the license see one of the following 3rd party sites:
//      - <https://opensource.org/licenses/MIT>
//      - <https://choosealicense.com/licenses/mit>
//      - <https://spdx.org/licenses/MIT>

/**
 * @ignore
 * @file Version script run when changing package.json version.
 * @author James Reid
 */

// @ts-check

// @@imports-node
import fs from "fs"

// @@body
// Fetch new version of plugin from package.json (from npm set env variable).
const targetVersion = process.env.npm_package_version

// Update manifest.json version with the targetVersion.
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf-8"))
manifest.version = targetVersion
fs.writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"))

// Update versions.json with target minAppVersion from manifest.json for the new
// targeVersion fetched from package.json.
const versions = JSON.parse(fs.readFileSync("versions.json", "utf8"))
versions[/** @type {string} */ (targetVersion)] = manifest.minAppVersion
fs.writeFileSync("versions.json", JSON.stringify(versions, null, "\t"))

// @@no-exports

// Copyright (c) 2022 James Reid. All rights reserved.
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
 * @file Tokei cli option types.
 * @author James Reid
 */

// @ts-check

// @@no-imports

// @@body
/**
 * Type of available cli options for tokei command.
 *
 * @typedef TokeiCliOptions
 * @property {string} path - Relative path to tokei.json from repo package.json
 *      file.
 * @property {string[]} include - List of directories to include relative to
 *      package.json.
 * @property {string} labelColor - Shields.io label colour (colour of left hand
 *      side of badge).
 * @property {string} color - Shields.io colour (colour of right hand side of
 *      badge).
 */

// @@exports
/**
 * @ignore
 * @type {TokeiCliOptions}
 */
export let TokeiCliOptions

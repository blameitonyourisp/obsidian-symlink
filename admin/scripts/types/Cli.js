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
 * @file Types for cli arguments and option flags.
 * @author James Reid
 */

// @ts-check

// @@no-imports

// @@body
/**
 * Allowable types for arguments of any cli option.
 *
 * @typedef {?string|string[]|boolean} CliArgument
 */

/**
 * Type of cli option object for setting, names, aliases, defaults, and
 * descriptions of a given cli option for correctly parsing cli arguments.
 *
 * @typedef {object} CliOption
 * @property {string} name - Option name.
 * @property {string[]} aliases - All allowable aliases for the named option.
 * @property {CliArgument} value - Default value of cli option argument.
 * @property {string} description - Description of cli option for help purposes.
 */

// @@exports
/**
 * @ignore
 * @type {CliArgument}
 */
export let CliArgument

/**
 * @ignore
 * @type {CliOption}
 */
export let CliOption

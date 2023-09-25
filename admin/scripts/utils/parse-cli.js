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
 * @file Parses cli option arguments in a basic fashion for local scripts.
 * @author James Reid
 */

// @ts-check

// @@imports-types
/* eslint-disable no-unused-vars -- Types only used in comments. */
import { decorateFg, padEndDecorated } from "./decorate-cli.js"
import { CliOption, CliArgument } from "../types/index.js"
/* eslint-enable no-unused-vars -- Close disable-enable pair */

// @@body
/**
 * Render help for a given cli option. Rendered string provides consistent
 * padding for each part/fragment of the string, such that consecutive help
 * strings are vertically aligned. Each string section is coloured differently,
 * and section of surrounded by brackets render the brackets in magenta.
 *
 * @summary Render help for a given cli option.
 * @param {string} alias - Option alias.
 * @param {string} name - Option name.
 * @param {string} type - Type of option argument.
 * @param {CliArgument} value - Default value of option.
 * @param {string} [description] - Optional description of option.
 * @returns {void}
 */
const renderHelp = (alias, name, type, value, description) => {
    // Reassign alias with single hyphen alias flag and "()" brackets.
    alias = padEndDecorated(`${
        decorateFg("(", "magenta")}${
        decorateFg(`-${alias}`, "red")}${
        decorateFg(")", "magenta")
    }`, 12)

    // Reassign option name with double hyphen option flag.
    name = `--${name}`.padEnd(28)

    // Reassign option type with "{}" brackets.
    type = padEndDecorated(`${
        decorateFg("{", "magenta")}${
        decorateFg(type, "yellow")}${
        decorateFg("}", "magenta")
    }`, 12)

    // Reassign default value with "[]" brackets.
    value = `${
        decorateFg("[", "magenta")}${
        decorateFg(/** @type {string} */ (value), "blue")}${
        decorateFg("]", "magenta")
    }`

    // Reassign description with line break if the description is set.
    description = description
        ? `\n${decorateFg(`|- ${description}`, "gray")}`
        : ""

    // Log option help string.
    console.log(`${alias}${name}${type}${value}${description}`)
}

/**
 * Parses cli arguments into an arguments object given an object of default
 * arguments and available aliases for each flag. Options without a default are
 * assumed to be of type string. Default options may be of type string, boolean,
 * or array.
 *
 * String type options override the previously set string. The final string will
 * be the first argument following this cli flag, or an empty string if the flag
 * is used without an argument. Any additional arguments before next cli flag
 * will be ignored.
 *
 * Boolean type options MUST default to false. Options should be named to
 * reflect this: for example "save" if the default should be to not perform a
 * save operation, and "ignore-save" or "disable-save" if the default should be
 * to perform a save operation. Using the cli flag will set option to true. Any
 * option arguments before next cli flag will be ignored.
 *
 * Array type options override the default array. The final array will be an
 * array of all arguments before the next cli flag, or an empty array if the
 * flag is used without any arguments.
 *
 * @summary Parses cli arguments into an arguments object.
 * @param {Object.<string,CliOption>} cli - Object containing the
 *      current state of parsed arguments, initial value passes option name,
 *      aliases, default values and descriptions for each cli option.
 * @param {string} [option] - Current cli option being updated.
 * @param {Map.<string,string>} [optionMap] - Map containing keys taken from all
 *      option names and aliases, mapping to string values of the corresponding
 *      option key in the cli parsed arguments object.
 * @param {number} [pointer=2] - Current pointer in the node process arguments,
 *      starts by default at 2 in order to ignore the path arguments.
 * @returns {Object.<string,CliArgument>} Returns object containing keys from
 *      original cli options object, each key mapping to the updated value
 *      of that option after all arguments have been parsed.
 */
const parseCliArguments = (cli, option, optionMap, pointer = 2) => {
    // Print help if requested, otherwise initialise optionMap from cli options.
    if (!optionMap) {
        // If required, print help according to the aliases, defaults and
        // descriptions supplied in the parsedArgs object then exit process.
        if (process.argv.includes("--help") || process.argv.includes("-h")) {
            // Log usage and format sections, as well as options header.
            console.log("USAGE:\nchangelog [OPTIONS]\n\nHELP FORMAT:")
            renderHelp("alias", "option-name", "type", "default", "description")
            console.log("\nOPTIONS:")

            // Log help string for each available cli option.
            for (const key in cli) {
                const { name, aliases, value, description } = cli[key]

                // Determine type based on default value of object.
                const type = value === null ? "string"
                    : typeof value === "undefined" ? "string"
                    : typeof value === "string" ? "string"
                    : typeof value === "boolean" ? "boolean"
                    : "string[]"

                renderHelp(aliases[0] || "", name, type, value, description)
            }

            // Exit process since no further action should be taken.
            process.exit()
        }

        // Initialise optionMap using the name and aliases of each option, and
        // mapping to the string key of the option object.
        optionMap = new Map()
        for (const key in cli) {
            const aliases = [...cli[key].aliases, cli[key].name]
            for (const alias of aliases) {
                // Note that if an name or alias is a duplicate of a previously
                // set key in the map, the later key will overwrite the original
                // without warning.
                optionMap.set(alias, key)
            }
        }
    }

    // If all arguments are parsed, return all updated values in an object with
    // keys from the original cli options object.
    if (pointer >= process.argv.length) {
        const parsedArgs = /** @type {Object.<string,CliArgument>} */ ({})
        for (const key in cli) { parsedArgs[key] = cli[key].value }
        return parsedArgs
    }

    // Parse current cli argument depending on if the argument is a new cli flag
    // or an argument pertaining to the last seen flag.
    const flag = process.argv[pointer].match(/(?<=^-).$|(?<=^--).{2,}$/)?.[0]
    OPTION_CHAIN: if (flag) {
        // If flag found, set the last seen flag to the new flag.
        option = optionMap.get(flag)
        if (!option) { break OPTION_CHAIN } // Break if option undefined

        // Reset default argument according to type of default argument.
        cli[option].value = cli[option].value === null ? ""
            : typeof cli[option].value === "undefined" ? ""
            : typeof cli[option].value === "string" ? ""
            : typeof cli[option].value === "boolean" ? true
            : []
    }
    else if (!option) { break OPTION_CHAIN } // Break if option undefined
    else if (typeof cli[option].value === "string") {
        // Reset string argument and option flag.
        cli[option].value = process.argv[pointer]
        option = undefined
    }
    else if (cli[option].value instanceof Array) {
        // Push to array argument.
        /** @type {string[]} */ (cli[option].value).push(process.argv[pointer])
    }

    // Recursively call with incremented pointer for cli argument array.
    return parseCliArguments(cli, option, optionMap, ++pointer)
}

// @@exports
export { parseCliArguments }

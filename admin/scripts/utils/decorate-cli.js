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
 * @file Functions for decorating cli strings.
 * @author James Reid
 */

// @ts-check

// @@no-imports

// @@body
/**
 * Custom error which renders an error in a uniform way, taking an options
 * object with reserved name and message fields, and then any other fields
 * relevant to the error, and rendering them with indentation.
 */
class DecoratedError extends Error {
    /**
     * Build new error based on supplied options object which may set the custom
     * name of the error, the top level message of the error, and then any
     * number of other custom fields.
     *
     * @param {Object.<string,string|number|boolean>} options - Options object
     *      containing any string keys, and string, number or boolean values.
     */
    constructor(options) {
        super()
        let message = ""

        // Parse all properties in options argument; if key is name, use value
        // to set the custom name of the error, if key is message, append value
        // top of error message, otherwise render a grey, tabbed key-value
        // pair to the end of the message string.
        for (const key in options) {
            switch (key) {
                case "name":
                    this.name = /** @type {string} */ (options[key])
                    break
                case "message":
                    message = `${options[key]}\n${message}`
                    break
                default: {
                    const detail = `${key}: ${options[key]}`
                    message = `${message}${decorateFg(detail, "gray", 1)}\n`
                }
            }
        }

        // Set error message which will be displayed.
        this.message = message || ""
    }
}

/**
 * Decorate a string with control characters for changing cli string colors and
 * text decoration. Adds supplied list of modifiers for the string, then uses
 * reset character to set text back to default.
 *
 * @summary Return original string decorated with control characters.
 * @param {string} string - String to be decorated.
 * @param {object} options - Options object.
 * @param {string[]=} options.modifiers - String array of modifiers/control
 *      characters to apply input string.
 * @param {number=} options.tabs - Number of tab indents to include on string.
 * @param {number=} options.tabSize - Number of spaces for each tab.
 * @returns {string} Original string decorated with control characters.
 */
const decorate = (string, { modifiers = [], tabs = 0, tabSize = 4 } = {}) => {
    // Make compound modifier string form array of supplied control characters.
    let compoundModifier = ""
    for (const modifier of modifiers) {
        compoundModifier = `${compoundModifier}${modifier}`
    }

    // Wrap input string with control characters and reset character.
    const reset = cliModifiers.decorations.reset
    const indent = " ".repeat(tabs * tabSize)
    return `${compoundModifier}${indent}${string}${reset}`
}

/**
 * Wrapper around decorate function to decorate a string with a foreground
 * colour control character, and optional number of tab indents.
 *
 * @summary Decorate a string with a foreground colour control character.
 * @param {string} string - String to be decorated.
 * @param {string} color - Desired foreground colour of string.
 * @param {number} [tabs=0] - Number of tab indents to include on string.
 * @returns {string} Original string decorated with color control character.
 */
const decorateFg = (string, color, tabs = 0) => {
    const colorModifier = cliModifiers.fgColors[color]
    // Return decorated string depending on if color resolves to valid control
    // character from object of cli modifiers.
    return colorModifier
        ? decorate(string, { modifiers: [colorModifier], tabs })
        : decorate(string, { tabs })
}

/**
 * Wrapper around decorate function to decorate a string with a background
 * colour control character, and optional number of tab indents.
 *
 * @summary Decorate a string with a background colour control character.
 * @param {string} string - String to be decorated.
 * @param {string} color - Desired background colour of string.
 * @param {number} [tabs=0] - Number of tab indents to include on string.
 * @returns {string} Original string decorated with color control character.
 */
const decorateBg = (string, color, tabs = 0) => {
    const colorModifier = cliModifiers.bgColors[color]

    // Return decorated string depending on if color resolves to valid control
    // character from object of cli modifiers.
    return colorModifier
        ? decorate(string, { modifiers: [colorModifier], tabs })
        : decorate(string, { tabs })
}

/**
 * Wrapper around String.prototype.padEnd method, which pads end of string
 * whilst ignoring length of control characters which will not be rendered by
 * the console (i.e. pad string such that the displayed string will be the
 * correct length when logged in the console).
 *
 * @summary Pad end of string, ignoring length of control characters.
 * @param {string} string - String to be padded.
 * @param {number} maxLength - Maximum length of string.
 * @param {string} [fillString] - Optional fill string passed to
 *      String.prototype.padEnd method
 * @returns {string} Original string padded at end, ignoring length of control
 *      characters.
 */
const padEndDecorated = (string, maxLength, fillString) => {
    // Calculate length of decorators in a string using control regex.
    const decoratorLength = string.match(/\x1b\[\d*m/g)?.join("").length || 0
    return string.padEnd(maxLength + decoratorLength, fillString)
}

/**
 * Wrapper around String.prototype.padStart method, which pads start of string
 * whilst ignoring length of control characters which will not be rendered by
 * the console (i.e. pad string such that the displayed string will be the
 * correct length when logged in the console).
 *
 * @summary Pad start of string, ignoring length of control characters.
 * @param {string} string - String to be padded.
 * @param {number} maxLength - Maximum length of string.
 * @param {string} [fillString] - Optional fill string passed to
 *      String.prototype.padStart method
 * @returns {string} Original string padded at end, ignoring length of control
 *      characters.
 */
const padStartDecorated = (string, maxLength, fillString) => {
    // Calculate length of decorators in a string using control regex.
    const decoratorLength = string.match(/\x1b\[\d*m/g)?.join("").length || 0
    return string.padStart(maxLength + decoratorLength, fillString)
}

// Object of cli control strings for decorations etc.
const cliModifiers = {
    // Foreground modifiers.
    /** @type {Object.<string,string>} */
    fgColors: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        gray: "\x1b[90m"
    },

    // Background modifiers.
    /** @type {Object.<string,string>} */
    bgColors: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
        gray: "\x1b[100m"
    },

    // Decoration modifiers.
    /** @type {Object.<string,string>} */
    decorations: {
        reset: "\x1b[0m",
        bright: "\x1b[1m",
        dim: "\x1b[2m",
        underline: "\x1b[4m",
        blink: "\x1b[5m",
        reverse: "\x1b[7m",
        hidden: "\x1b[8m"
    }
}

/**
 * Convert kebab-case string to camelCase string, removing all hyphens in input
 * string, and capitalising the first character following each hyphen. Options
 * available for generating UpperCamelCase strings, and spaced strings too.
 *
 * @summary Convert kebab-case string to camelCase string.
 * @param {string} kebabCaseString - Input kebab-case string.
 * @param {boolean} isUpper - Should return string be in UpperCamelCase?
 * @param {boolean} isSpaced - Should return string replace hyphens with
 *      whitespace characters?
 * @returns {string} camelCase string version of input.
 */
const toCamelCase = (kebabCaseString, isUpper = false, isSpaced = false) => {
    // Reduce split input string with starting value object containing an empty
    // string and flag set to isUpper for if next character should be capital.
    return (kebabCaseString.split("").reduce((acc, cur) => {
        // Ignore hyphens, or replace with spaces as required.
        if (cur === "-") {
            return isSpaced
                ? { string: `${acc.string} `, isCapital: true }
                : { ...acc, isCapital: true }
        }

        // Concatenate string with next character set to uppercase if required.
        const nextChar = acc.isCapital ? cur.toUpperCase() : cur.toLowerCase()
        return { string: `${acc.string}${nextChar}`, isCapital: false }
    }, { string: "", isCapital: isUpper }).string)
}

/**
 * Convert camelCaseString to kebab-case-string, adding hyphens between words.
 * If input string includes spaces (for example the verbatim title of a
 * markdown documentation file), replace with hyphens - this is good for
 * converting a title string to a valid kebab-case-filename. Option also
 * available for generating Upper-Kebab-Case strings.
 *
 * @summary Convert camelCaseString to kebab-case-string.
 * @param {string} camelCaseString - Input camelCaseString.
 * @param {boolean} isUpper - Should return string be in Upper-Kebab-Case?
 * @returns {string} kebab-case-string version of input.
 */
const toKebabCase = (camelCaseString, isUpper = false) => {
    // Reduce split input string with starting value object containing an empty
    // string and a new word flag set to true.
    return (camelCaseString.split("").reduce((acc, cur) => {
        // Ignore spaces in the input string, but set new word flag to true.
        if (cur === " ") {
            return { ...acc, isNewWord: true }
        }

        // If new word flag is set, or if an uppercase letter is found, insert
        // a hyphen before appending the upper/lowercase version of the current
        // letter depending on the isUpper argument.
        else if (acc.isNewWord || cur.match(/[A-Z]/)) {
            const nextChar = isUpper ? cur.toUpperCase() : cur.toLowerCase()
            return acc.string
                ? { string: `${acc.string}-${nextChar}`, isNewWord: false }
                : { string: `${nextChar}`, isNewWord: false }
        }

        // Otherwise, append current letter in lowercase.
        const nextChar = cur.toLowerCase()
        return { string: `${acc.string}${nextChar}`, isNewWord: false }
    }, { string: "", isNewWord: true }).string)
}

// @@exports
export {
    DecoratedError,
    decorate,
    decorateFg,
    decorateBg,
    padEndDecorated,
    padStartDecorated,
    cliModifiers,
    toCamelCase,
    toKebabCase
}

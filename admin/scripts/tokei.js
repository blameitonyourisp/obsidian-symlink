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
 * @file Counts approximate lines of code written by the author.
 * @author James Reid
 */

// @ts-check

// @@imports-node
import { exec } from "child_process"
import fs from "fs"

// @@imports-utils
import { parseCliArguments } from "./utils/index.js"

// @@imports-types
/* eslint-disable no-unused-vars -- Types only used in comments. */
import { TokeiCliOptions } from "./types/index.js"
/* eslint-enable no-unused-vars -- Close disable-enable pair. */

// @@body
// Explicit include list for source code and documentation rather than using a
// repetitive .tokeignore file to exclude boilerplate config file etc., also
// default colours for shields.io badge.
const defaults = {
    path: {
        name: "path",
        aliases: ["p"],
        value: "./dist/tokei.json",
        description: "Relative path to tokei.json from repo package.json file."
    },
    include: {
        name: "include",
        aliases: ["i"],
        value: ["src", "docs"],
        description: "List of directories to include relative to package.json."
    },
    labelColor: {
        name: "label-color",
        aliases: ["l"],
        value: "191a1a",
        description: ""
    },
    color: {
        name: "color",
        aliases: ["c"],
        value: "779966",
        description: ""
    }
}
const { path, include, labelColor, color } = /** @type {TokeiCliOptions} */
    (parseCliArguments(defaults))

// Count lines of code using tokei - note that this uses the "tokei" command
// which is a cli application written in rust, this script will not run without
// tokei being installed on the system.
// For information on installing and configuring tokei, please see here
// https://github.com/XAMPPRocky/tokei.
exec(`tokei --output json ${include.join(" ")}`, (error, stdout, stderr) => {
    // Return errors if any.
    if (error) { return console.error(`exec error: ${error}`) }
    if (stderr) { return console.error(`stderr: ${stderr}`) }

    // Fetch total line counts from tokei json output.
    const { blanks, code, comments } = JSON.parse(stdout)["Total"]
    const lineCount = blanks + code + comments

    // Create shields endpoint object according to the available options and
    // defaults found here https://shields.io/endpoint, rounding line count
    // if over 1k lines.
    const data = {
        schemaVersion: 1,
        label: "lines written",
        message: lineCount < 1000 ? lineCount.toString()
            : `${(lineCount / 1000).toFixed(1)}k`,
        style: "for-the-badge",
        labelColor, // Left badge color.
        color // Right badge color.
    }

    // Save endpoint to dist dir and log total line count (dist dir must exist).
    fs.writeFileSync(path, JSON.stringify(data))
    return console.log(`\nlines of code: ${lineCount}`)
})

// @@no-exports

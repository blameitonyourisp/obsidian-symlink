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
 * @file Backoff wrapper around setTimeout.
 * @author James Reid
 */

// @ts-check

// @@no-imports

// @@body
/**
 *
 * @param callback -
 * @param condition -
 * @param backoffMs -
 * @param obj -
 * @param retries -
 * @param startMs -
 */
const setBackoff = (
    callback: () => void,
    condition: () => boolean,
    backoffMs: (retries: number) => number,
    { maxRetries = Infinity, maxMs = Infinity } = {},
    retries = 0,
    startMs = Date.now()
): void => {
    //
    retries++

    //
    if (condition()) { return callback() }
    if (retries > maxRetries || Date.now() - startMs > maxMs) { return }

    //
    setTimeout(() => setBackoff(
        callback,
        condition,
        backoffMs,
        { maxRetries, maxMs },
        retries,
        startMs
    ), backoffMs(retries))
}

/**
 *
 * @param callback -
 * @param condition -
 * @param obj -
 */
const setConstantBackoff = (
    callback: () => void,
    condition: () => boolean,
    { startMs = 10, maxRetries = Infinity, maxMs = Infinity } = {}
): void => {
    const backoffMs = () => startMs
    return setBackoff(callback, condition, backoffMs, { maxRetries, maxMs })
}

/**
 *
 * @param callback -
 * @param condition -
 * @param obj -
 */
const setLinearBackoff = (
    callback: () => void,
    condition: () => boolean,
    { startMs = 10, maxRetries = Infinity, maxMs = Infinity } = {}
): void => {
    const backoffMs = (retries: number) => startMs + startMs * retries
    return setBackoff(callback, condition, backoffMs, { maxRetries, maxMs })
}

/**
 *
 * @param callback -
 * @param condition -
 * @param obj -
 */
const setExponentialBackoff = (
    callback: () => void,
    condition: () => boolean,
    { startMs = 10, maxRetries = Infinity, maxMs = Infinity } = {}
): void => {
    const backoffMs = (retries: number) => startMs + startMs ** retries
    return setBackoff(callback, condition, backoffMs, { maxRetries, maxMs })
}

// @@exports
export {
    setBackoff,
    setConstantBackoff,
    setLinearBackoff,
    setExponentialBackoff
}

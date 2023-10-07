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
 * Backoff wrapper around node setTimeout function, which repeatedly calls a
 * setTimeout function with itself as a callback until some condition is met, at
 * which point the provided callback function will be executed. Custom function
 * to calculate backoff time based on number of retries (e.g. constant, linear,
 * or exponential backoff time) must be provided. Backoff will give up if max
 * number of retries and/a time elapsed are exceeded.
 *
 * @summary Backoff wrapper around setTimeout which executes callback only when
 *      a certain condition is met.
 * @param callback - Arity 0, void return callback function to be executed when
 *      backoff condition is met.
 * @param condition - Arity 0, boolean return callback function executed at each
 *      backoff retry. Should return true when the required backoff condition is
 *      met and main callback should be executed.
 * @param backoffMs - Unary callback taking current number of backoff retries,
 *      and returning a number in milliseconds for the time until the next
 *      backoff retry.
 * @param obj - Object with properties for maximum retries and/or time elapsed
 *      in milliseconds until backoff gives up without executing main callback.
 * @param retries - Current retries.
 * @param startMs - Timestamp when backoff for first called.
 */
const setBackoff = (
    callback: () => void,
    condition: () => boolean,
    backoffMs: (retries: number) => number,
    { maxRetries = Infinity, maxMs = Infinity } = {},
    retries = 0,
    startMs = Date.now()
): void => {
    // Increment retry count.
    retries++

    // Execute callback if end condition met. If condition not met, check if
    // total elapsed time or retry count exceed passed parameters, and return
    // without executing callback if either value is exceeded.
    if (condition()) { return callback() }
    if (retries > maxRetries || Date.now() - startMs > maxMs) { return }

    // Recall backoff using setTimeout according to a delay value calculated
    // using the backoffMs callback.
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
 * Wrapper around setBackoff function which sets the backoff as a constant value
 * equal to the startMs property set in the object argument of the arguments
 * (i.e. `backoffMs = c` where `c` is some constant time in milliseconds).
 *
 * @summary Constant time backoff wrapper around setBackoff.
 * @param callback - Arity 0, void return callback function to be executed when
 *      backoff condition is met.
 * @param condition - Arity 0, boolean return callback function executed at each
 *      backoff retry. Should return true when the required backoff condition is
 *      met and main callback should be executed.
 * @param obj - Object with properties for maximum retries, time elapsed in
 *      milliseconds until backoff gives up without executing main callback, and
 *      or the initial backoff time before first retry in milliseconds.
 */
const setConstantBackoff = (
    callback: () => void,
    condition: () => boolean,
    { startMs = 10, maxRetries = Infinity, maxMs = Infinity } = {}
): void => {
    // Declare backoff callback function, and call setBackoff with given args.
    const backoffMs = () => startMs
    return setBackoff(callback, condition, backoffMs, { maxRetries, maxMs })
}

/**
 * Wrapper around setBackoff function which sets the backoff as a linearly
 * increasing value which starts with a value equal to the startMs property set
 * in the object argument of the arguments, and is incremented by the same value
 * at each step (i.e. `backoffMs = c(1 + r)` where `c` is some constant time in
 * milliseconds, and `r` is the number of retries starting at 0).
 *
 * @summary Linear time backoff wrapper around setBackoff.
 * @param callback - Arity 0, void return callback function to be executed when
 *      backoff condition is met.
 * @param condition - Arity 0, boolean return callback function executed at each
 *      backoff retry. Should return true when the required backoff condition is
 *      met and main callback should be executed.
 * @param obj - Object with properties for maximum retries, time elapsed in
 *      milliseconds until backoff gives up without executing main callback, and
 *      or the initial backoff time before first retry in milliseconds.
 */
const setLinearBackoff = (
    callback: () => void,
    condition: () => boolean,
    { startMs = 10, maxRetries = Infinity, maxMs = Infinity } = {}
): void => {
    // Declare backoff callback function, and call setBackoff with given args.
    const backoffMs = (retries: number) => startMs * (1 + retries)
    return setBackoff(callback, condition, backoffMs, { maxRetries, maxMs })
}

/**
 * Wrapper around setBackoff function which sets the backoff as an exponentially
 * increasing value which starts with a value equal to the startMs property set
 * in the object argument of the arguments, and is incremented by the same value
 * at each step (i.e. `backoffMs = c * 2^r` where `c` is some constant time in
 * milliseconds, and `r` is the number of retries starting at 0).
 *
 * @summary Exponential time backoff wrapper around setBackoff.
 * @param callback - Arity 0, void return callback function to be executed when
 *      backoff condition is met.
 * @param condition - Arity 0, boolean return callback function executed at each
 *      backoff retry. Should return true when the required backoff condition is
 *      met and main callback should be executed.
 * @param obj - Object with properties for maximum retries, time elapsed in
 *      milliseconds until backoff gives up without executing main callback, and
 *      or the initial backoff time before first retry in milliseconds.
 */
const setExponentialBackoff = (
    callback: () => void,
    condition: () => boolean,
    { startMs = 10, maxRetries = Infinity, maxMs = Infinity } = {}
): void => {
    // Declare backoff callback function, and call setBackoff with given args.
    const backoffMs = (retries: number) => startMs * 2 ** retries
    return setBackoff(callback, condition, backoffMs, { maxRetries, maxMs })
}

// @@exports
export {
    setBackoff,
    setConstantBackoff,
    setLinearBackoff,
    setExponentialBackoff
}

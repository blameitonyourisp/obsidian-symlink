const setBackoff = (
    callback: () => void,
    condition: () => boolean,
    backoffMs: (retries: number) => number,
    { maxRetries = Infinity, maxMs = Infinity } = {},
    retries = 0,
    startMs = Date.now()
): void => {
    retries++
    if (condition()) { return callback() }
    if (retries > maxRetries || Date.now() - startMs > maxMs) { return }
    setTimeout(() => setBackoff(
        callback,
        condition,
        backoffMs,
        { maxRetries, maxMs },
        retries,
        startMs
    ), backoffMs(retries))
}

const setConstantBackoff = (
    callback: () => void, 
    condition: () => boolean, 
    { startMs = 10, maxRetries = Infinity, maxMs = Infinity } = {}
): void => {
    const backoffMs = () => startMs 
    return setBackoff(callback, condition, backoffMs, { maxRetries, maxMs })
}

const setLinearBackoff = (
    callback: () => void, 
    condition: () => boolean, 
    { startMs = 10, maxRetries = Infinity, maxMs = Infinity } = {}
): void => {
    const backoffMs = (retries: number) => startMs + startMs * retries
    return setBackoff(callback, condition, backoffMs, { maxRetries, maxMs })
}

const setExponentialBackoff = (
    callback: () => void, 
    condition: () => boolean, 
    { startMs = 10, maxRetries = Infinity, maxMs = Infinity } = {}
): void => {
    const backoffMs = (retries: number) => startMs + startMs ** retries
    return setBackoff(callback, condition, backoffMs, { maxRetries, maxMs })
}

// @exports
export { 
    setBackoff,
    setConstantBackoff,
    setLinearBackoff,
    setExponentialBackoff
}

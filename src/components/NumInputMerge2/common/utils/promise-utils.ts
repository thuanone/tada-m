export type PromiseHandlerFn = (arrElem: any, arrIdx?: number) => Promise<any>;
export type InFlightCallbackFn = (numInFlight: number, numResolved: number, numRejected: number) => void;

/**
 * Processes each element of the given array, by calling the handlerFn() function, which returns a Promise
 * for the actual operation that is being run on each element.
 *
 * The maximum concurrency can be configured to limit the amount of promises that are created / run in parallel.
 *
 * The function returns a promise, which only resolves, if all individual promises successfully resolved. Otherwise
 * it will reject with the rejection result of the failing promise. No further promises will be created / run, once an
 * error was encountered (non-atomic operation).
 *
 * @param srcArray
 * @param maxConcurrentPromises
 * @param handlerFn
 */
export function promiseEach(srcArray: any[],
                            maxConcurrentPromises: number,
                            handlerFn: PromiseHandlerFn,
                            inFlightCallback: InFlightCallbackFn): Promise<void> {

    return new Promise((globalResolve, globalReject) => {

        let currentIdx = -1;
        let inFlightCount = 0;
        let resolvedCount = 0;
        let rejectedCount = 0;
        let globalError;  // if an error occurred, we will stop spawning more promises and simply wait until all in-flight
                          // promises are settled
        let isSettled = false;

        const reportStatus = () => {
            if (typeof inFlightCallback === 'function') {
                inFlightCallback(inFlightCount, resolvedCount, rejectedCount);
            }
        };

        const resolvePromiseHandler = () => {
            inFlightCount -= 1;
            resolvedCount += 1;

            reportStatus();

            triggerNextPromises();
        };

        const rejectPromiseHandler = (error) => {
            globalError = error;
            rejectedCount += 1;
            inFlightCount -= 1;

            reportStatus();

            triggerNextPromises();
        };

        const done = () => {
            if (!isSettled) {
                if (globalError) {
                    isSettled = true;
                    globalReject(globalError);
                } else {
                    isSettled = true;
                    globalResolve();
                }
            }
        };

        const triggerNextPromises = () => {
            if (!isSettled) {
                if ((inFlightCount === 0) &&
                    (currentIdx >= srcArray.length)) {
                    done();
                } else {
                    while ((inFlightCount < maxConcurrentPromises) &&
                           (currentIdx < srcArray.length)) {

                        currentIdx += 1;

                        if (currentIdx < srcArray.length) {

                            inFlightCount += 1;

                            reportStatus();

                            handlerFn(srcArray[currentIdx], currentIdx)
                                .then(resolvePromiseHandler)
                                .catch(rejectPromiseHandler);
                        } else {
                            // done already?
                            if (inFlightCount <= 0) {
                                done();
                                return;
                            }
                        }
                    }
                }
            }
        };

        // sanity checks first
        if (!srcArray || srcArray.length === 0) {
            // with an empty array, we have nothing to do!
            globalResolve();
            return;
        } else if (typeof handlerFn !== 'function') {
            // cannot produce any promises without a handlerFn()
            globalReject(new Error('promise-utils: HandlerFn is not a function.'));
        } else if (maxConcurrentPromises <= 0) {
            // won't be able to run any promises
            globalReject(new Error('promise-utils: MaxConcurrentPromises is 0 with a non-empty array.'));
            return;
        }

        triggerNextPromises();
    });
}

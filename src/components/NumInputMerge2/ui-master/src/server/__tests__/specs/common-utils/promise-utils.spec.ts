describe('common memory utils', () => {
    // tslint:disable-next-line:no-var-requires
    const proxyquire = require('proxyquire').noCallThru();

    function getResolvingPromiseWithDelay(delay: number, returnValue: any): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(returnValue);
            }, delay);
        });
    }

    function getRejectingPromiseWithDelay(delay: number, errorValue: any): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(errorValue);
            }, delay);
        });
    }

    function getTestObj() {
        return {
            isProcessed: false,
        };
    }

    function buildTestArray(numEntries: number) {
        const result = [];

        for (let i = 0; i < numEntries; i++) {
            result.push(getTestObj());
        }

        return result;
    }

    function inspectTestArray(testArr) {
        let numErr = 0;
        let numResolved = 0;

        for (const elem of testArr) {
            if (elem.isProcessed) {
                numResolved += 1;
            } else {
                numErr += 1;
            }
        }

        return {
            numErr,
            numResolved,
        };
    }

    let promiseUtils: any;

    beforeEach(() => {
        promiseUtils = proxyquire('../../../../common/utils/promise-utils', {});
    });

    it( 'immediately resolves with an empty array', () => {
        let numStatusCallbacks = 0;

        const callback = () => {
            numStatusCallbacks += 1;
        };

        return promiseUtils.promiseEach([], 3, (elem, idx) => {
            return getResolvingPromiseWithDelay(50, idx);
        }, callback)
        .then(() => {
            expect(numStatusCallbacks).toEqual(0);
        });
    });

    it( 'immediately rejects with a concurrency of 0 and a non-empty array', () => {
        let numStatusCallbacks = 0;

        const callback = () => {
            numStatusCallbacks += 1;
        };

        return promiseUtils.promiseEach([1], 0, () => {
            // no-op
        })
        .then(() => {
            throw new Error('Unexpected Promise resolution - should have rejected!');
        })
        .catch((e: Error) => {
            expect(numStatusCallbacks).toEqual(0);
            expect(e.message).toEqual('promise-utils: MaxConcurrentPromises is 0 with a non-empty array.');
        });
    });

    it( 'immediately rejects with a missing handler function and a non-empty array', () => {
        return promiseUtils.promiseEach([1], 0)
        .then(() => {
            throw new Error('Unexpected Promise resolution - should have rejected!');
        })
        .catch((e: Error) => {
            expect(e.message).toEqual('promise-utils: HandlerFn is not a function.');
        });
    });

    it( 'immediately rejects with a handler function param that is not a function and a non-empty array', () => {
        return promiseUtils.promiseEach([1], 0, 'not a function')
            .then(() => {
                throw new Error('Unexpected Promise resolution - should have rejected!');
            })
            .catch((e: Error) => {
                expect(e.message).toEqual('promise-utils: HandlerFn is not a function.');
            });
    });

    it( 'properly resolves when all promises got resolved', () => {
        const testData = buildTestArray(10);

        return promiseUtils.promiseEach(testData, 3, (elem) => {
            elem.isProcessed = true;
            return Promise.resolve();
        })
        .then(() => {
            const result = inspectTestArray(testData);
            expect(result.numResolved).toEqual(10);
            expect(result.numErr).toEqual(0);
        });
    });

    it('properly rejects when a promise got rejected', () => {
        const testData = buildTestArray(10);

        return promiseUtils.promiseEach(testData, 3, (elem, idx) => {
            if (idx < 5) {
                elem.isProcessed = true;
                return Promise.resolve();
            } else {
                return Promise.reject(new Error('I do not like the index'));
            }
        })
        .then(() => {
            throw new Error('Unexpected Promise resolution - should have rejected!');
        })
        .catch((e: Error) => {
            const result = inspectTestArray(testData);
            expect(result.numResolved).toEqual(5);
            expect(result.numErr).toEqual(5);
            expect(e.message).toEqual('I do not like the index');
        });
    });

    it('executes not more than the given maximum of parallel promises', () => {
        const testData = buildTestArray(10);
        let maxInflightPromises = 0;

        return promiseUtils.promiseEach(testData, 3, (elem, idx) => {
            elem.isProcessed = true;
            return Promise.resolve();
        }, (inFlightCount, resolvedCount, rejectedCount) => {
            maxInflightPromises = Math.max(maxInflightPromises, inFlightCount);
        })
        .then(() => {
            const result = inspectTestArray(testData);
            expect(result.numResolved).toEqual(10);
            expect(result.numErr).toEqual(0);
            expect(maxInflightPromises).toBeLessThanOrEqual(3);
        });
    });

    it('does not start another promise, if another one already rejected', () => {
        const testData = buildTestArray(10);

        return promiseUtils.promiseEach(testData, 3, (elem, idx) => {
            if (idx < 5) {
                elem.isProcessed = true;
                return Promise.resolve();
            } else {
                return Promise.reject(new Error('I do not like the index'));
            }
        })
        .then(() => {
            throw new Error('Unexpected Promise resolution - should have rejected!');
        })
        .catch((e: Error) => {
            for (let i = 5; i < testData.length; i++) {
                expect(testData[i].isProcessed).toBeFalsy();
            }
            const result = inspectTestArray(testData);
            expect(result.numResolved).toEqual(5);
            expect(result.numErr).toEqual(5);
            expect(e.message).toEqual('I do not like the index');
        });
    });

    it('does not reject while there are still other inflight promises', () => {
        const startTime = Date.now();

        const testData = buildTestArray(10);

        return promiseUtils.promiseEach(testData, 6, (elem, idx) => {
            return new Promise((resolve, reject) => {
                if (idx < 5) {
                    setTimeout(() => {
                        elem.isProcessed = true;
                        resolve();
                    }, 500);
                } else {
                    reject(new Error('I do not like the index'));
                }
            });
        })
        .then(() => {
            throw new Error('Unexpected Promise resolution - should have rejected!');
        })
        .catch((e: Error) => {
            const endTime = Date.now();

            // although the failing promise is started in the first batch of promises,
            // the rejection needs to wait until at least 400ms have passed
            expect(endTime - startTime).toBeGreaterThanOrEqual(400);

            for (let i = 0; i < 5; i++) {
                expect(testData[i].isProcessed).toBeTruthy();
            }
            for (let i = 5; i < testData.length; i++) {
                expect(testData[i].isProcessed).toBeFalsy();
            }

            const result = inspectTestArray(testData);
            expect(result.numResolved).toEqual(5);
            expect(result.numErr).toEqual(5);
            expect(e.message).toEqual('I do not like the index');
        });
    });

    it('does not resolve with promises still being inflight', () => {
        const startTime = Date.now();

        const testData = buildTestArray(10);

        return promiseUtils.promiseEach(testData, 1, (elem, idx) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    elem.isProcessed = true;
                    resolve();
                }, 100);
            });
        })
        .then(() => {
            const endTime = Date.now();

            expect(endTime - startTime).toBeGreaterThanOrEqual(950);

            for (const elem of testData) {
                expect(elem.isProcessed).toBeTruthy();
            }

            const result = inspectTestArray(testData);
            expect(result.numResolved).toEqual(10);
            expect(result.numErr).toEqual(0);
        });
    });
});

import * as loggerUtil from '@console/console-platform-log4js-utils';
import * as  csrf from 'csurf';
const logger = loggerUtil.getLogger('clg-ui:utils:csrf');

const csrfToken = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
    },
});

export function createCsrfToken() {
    return csrfToken;
}

function isClgCsrfValidationDisabled(): boolean {
    return process.env.NODE_ENV === 'development' && process.env.coligoCsrfDisabled === 'true';
}

export function verifyCsrfToken(req, res, next) {

    // in order to ease unit tests, we allow to disable this validation
    if (isClgCsrfValidationDisabled()) {
        return next();
    }

    try {
        csrfToken(req, res, next);
    } catch (err) {
        logger.error('ERROR IS ', err);
        if (err.code !== 'EBADCSRFTOKEN') {
            next(err);
            return;
        }

        const requestCSRFToken = req.headers && (req.headers['csrf-token']);
        logger.error(`CSRF Token mismatch! requestCSRFToken: ${requestCSRFToken}, csrfSecret: ${req.cookies && req.cookies.developer_csrf}`);

        // handle CSRF token errors here
        res.status(403).send(Error('CSRF Token Mismatch'));
    }
}

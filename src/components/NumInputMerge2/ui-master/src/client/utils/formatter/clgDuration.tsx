import React from 'react';
import t from '../i18n';

const SecondMillis = 1000;
const MinuteMillis = 60000;
const HourMillis = 3600000;

function getNlsKey(unit: string, isStillRunning: boolean) {
    let result = 'clg.formatter.label.duration.';

    if (isStillRunning) {
        result += 'running.';
    }

    result += unit;
    return result;
}

function replaceDotWithColon(durationStr: string) {
    if (durationStr && durationStr.indexOf('.') > -1) {
        return durationStr.replace('.', ':');
    } else {
        return durationStr;
    }
}

function formatHoursMinutes(duration: number) {
    const hours = Math.floor(duration / HourMillis);
    const remainder = duration - (hours * HourMillis);
    const minutes = Math.floor(remainder / MinuteMillis);

    let result = `${hours}`;

    if (minutes > 0) {
        result += `:${minutes}`;
    }

    return result;
}

function formatMinutesSeconds(duration: number) {
    const minutes = Math.floor(duration / MinuteMillis);
    const remainder = duration - (minutes * MinuteMillis);
    const seconds = Math.floor(remainder / SecondMillis);

    let result = `${minutes}`;

    if (seconds > 0) {
        result += `:${seconds}`;
    }

    return result;
}

const render = (item) => {
    let duration;
    let stillRunning: boolean = false;

    // calculate duration based on created/completed timestamps
    if (!item.created) {
        return React.createElement('span', {
            className: 'bx--type-caption'
        }, t('clg.formatter.label.ago.notavailable'));
    } else {
        if (!item.completed) {
            duration = Date.now() - item.created;
            stillRunning = true;
        } else {
            // calculate actual duration and display it using react-timeago as well (no live-update necessary)
            duration = item.completed - item.created;
        }
        // render duration either as ms, seconds, minutes or hours (we don't support runtimes over 24h, so days or anything larger is unsupported for now)
        if (Math.floor(duration / HourMillis) >= 1) {
            return React.createElement('span', {
                className: 'bx--type-caption',
            }, replaceDotWithColon(t(getNlsKey('hours', stillRunning), { hours: formatHoursMinutes(duration) })));
        } else {
            if (Math.floor(duration / MinuteMillis) >= 1) {
                return React.createElement('span', {
                    className: 'bx--type-caption',
                }, replaceDotWithColon(t(getNlsKey('minutes', stillRunning), { minutes: formatMinutesSeconds(duration) })));
            } else {
                if (Math.floor(duration / SecondMillis) >= 1) {
                    return React.createElement('span', {
                        className: 'bx--type-caption',
                    }, replaceDotWithColon(t(getNlsKey('seconds', stillRunning), { seconds: (Math.round(duration * 100) / SecondMillis / 100).toFixed(0) })));
                    // no fraction part for seconds
                } else {
                    return React.createElement('span', {
                        className: 'bx--type-caption',
                    }, replaceDotWithColon(t(getNlsKey('millis', stillRunning), { millis: (Math.round(duration * 100) / 100).toFixed(0) })));
                    // no fraction part for milliseconds
                }
            }
        }
    }
};

const value = (item) => {
    let duration;
    let result;

    if (!item.completed) {
        duration = Date.now() - item.created;
    } else {
        duration = item.completed - item.created;
    }

    if (duration) {
        result = t('clg.formatter.label.ago.millis', { millis: duration });
    } else {
        result = t('clg.formatter.label.ago.notavailable');
    }

    return result;
};

export default { render, value };

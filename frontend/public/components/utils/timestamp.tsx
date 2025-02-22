import * as React from 'react';
import { connect } from 'react-redux';
import { Tooltip } from '@patternfly/react-core';
import * as classNames from 'classnames';
import { GlobeAmericasIcon } from '@patternfly/react-icons';

import * as dateTime from './datetime';

const monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const timestampFor = (mdate: Date, now: Date, omitSuffix: boolean) => {
  if (!dateTime.isValid(mdate)) {
    return '-';
  }

  const timeDifference = now.getTime() - mdate.getTime();
  if (omitSuffix) {
    return dateTime.fromNow(mdate, undefined, {omitSuffix: true});
  }
  if (Math.sign(timeDifference) !== -1 && timeDifference < 630000) { // 10.5 minutes
    // Show a relative time if within 10.5 minutes in the past from the current time.
    return dateTime.fromNow(mdate);
  }

  let a = 'am';
  let hours = mdate.getHours();
  if (hours > 12) {
    hours -= 12;
    a = 'pm';
  }

  const minuteStr = mdate.getMinutes().toString().padStart(2, '00');
  let timeStr = `${hours}:${minuteStr} ${a}`;
  if (mdate.getFullYear() !== now.getFullYear()) {
    timeStr = `${mdate.getFullYear()} ${timeStr}`;
  }

  const monthStr = monthAbbrs[mdate.getMonth()];

  return `${monthStr} ${mdate.getDate()}, ${timeStr}`;
};

const nowStateToProps = ({UI}) => ({now: UI.get('lastTick')});

export const Timestamp = connect(nowStateToProps)((props: TimestampProps) => {
  const mdate = props.isUnix ? new Date((props.timestamp as number) * 1000) : new Date(props.timestamp);
  const timestamp = timestampFor(mdate, new Date(props.now), props.omitSuffix);

  if (!dateTime.isValid(mdate)) {
    return <div className="co-timestamp">-</div>;
  }

  if (props.simple) {
    return <React.Fragment>{timestamp}</React.Fragment>;
  }

  return <div className={classNames('co-timestamp co-icon-and-text', props.className)}>
    <GlobeAmericasIcon className="co-icon-and-text__icon" />
    <Tooltip content={[<span className="co-nowrap" key="co-timestamp">{ mdate.toISOString() }</span>]}>
      <span>{ timestamp }</span>
    </Tooltip>
  </div>;
});

export type TimestampProps = {
  timestamp: string | number;
  isUnix?: boolean;
  now: number;
  simple?: boolean;
  omitSuffix?: boolean;
  className?: string;
};

Timestamp.displayName = 'Timestamp';

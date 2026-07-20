/* eslint-disable func-names */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import duration from "dayjs/plugin/duration";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import jalaliday from "jalaliday";

dayjs.extend(utc);
dayjs.extend(duration);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(jalaliday);

export default dayjs;
dayjs.extend(jalaliday);

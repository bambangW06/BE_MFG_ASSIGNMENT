const moment = require("moment-timezone");

function getShiftInterval(now = moment().tz("Asia/Jakarta")) {
  const todayStart7 = moment(now).startOf("day").add(7, "hours"); // hari ini jam 07:00
  const todayMidnight = moment(now).startOf("day").add(1, "day").startOf("day"); // tengah malam hari ini (00:00)

  let start, end;

  if (now.isSameOrAfter(todayStart7) && now.isBefore(todayMidnight)) {
    start = todayStart7;
    end = todayMidnight;
  } else {
    start = moment(now).subtract(1, "day").startOf("day").add(7, "hours"); // kemarin jam 07:00
    end = todayStart7;
  }

  return {
    start: start.format("YYYY-MM-DD HH:mm:ss"),
    end: end.format("YYYY-MM-DD HH:mm:ss"),
  };
}

module.exports = { getShiftInterval };

export function getPercentage(a, b) {
  return (a / b) * 100;
}

/**
 *
 * @param {number} timeInSeconds - if given as floating point value, it is floored.
 * @returns  a string representing timeInSeconds in HH:MM:SS format.
 * (e.g) getDurationFromSeconds(3910) returns "1:05:10"
 */
export function getDurationFromSeconds(timeInSeconds) {
  let time = Math.floor(timeInSeconds);
  const hours = Math.floor(time / 3600);
  time = time - hours * 3600;
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time - minutes * 60);

  let videoTimeStr = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  if (hours) {
    videoTimeStr = `${hours}:${minutes}:${
      seconds < 10 ? "0" + seconds : seconds
    }`;
  }
  return videoTimeStr;
}

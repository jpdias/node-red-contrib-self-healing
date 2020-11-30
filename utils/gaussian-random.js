/**
 * Returns a normally-distributed random number
 * @param {Object} options
 * @param {number} options.mean         The mean of the distribution. Default is 0
 * @param {number} options.stdDeviation The standard deviation of the distribution. Default is 1
 */
function gaussianRandom({ mean = 0.0, stdDeviation = 1.0 } = {}) {
  // we are using the https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
  let uniform1 = 0;
  let uniform2 = 0;
  // Math.random() is in [0,1) and we need in (0,1)
  while (uniform1 < Number.EPSILON || uniform2 < Number.EPSILON) {
    uniform1 = Math.random();
    uniform2 = Math.random();
  }
  const gaussian =
    Math.sqrt(-2.0 * Math.log(uniform1)) * Math.cos(2.0 * Math.PI * uniform2);
  return stdDeviation * gaussian + mean;
}

module.exports = gaussianRandom;

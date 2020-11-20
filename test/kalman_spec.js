const helper = require("node-red-node-test-helper");
const kalmanNode = require("../kalman-noise-filter/kalman.js");
const gaussianRandom = require("../utils/gaussian-random.js");
const _should = require("should");

helper.init(require.resolve("node-red"));

describe("kalman-noise-filter node", function () {
  beforeEach((done) => helper.startServer(done));
  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function (done) {
    const testFlow = [
      {
        id: "node1",
        type: "kalman-noise-filter",
        name: "kalman",
      },
    ];
    helper.load(kalmanNode, testFlow, function () {
      const testNode = helper.getNode("node1");
      try {
        testNode.should.have.property("name", "kalman");
        testNode.should.have.property("type", "kalman-noise-filter");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  const getTestData = generateNoisyData.bind(null, {
    mean: 8,
    processNoise: 0.05,
    measurementNoise: 1.2,
    size: 500,
  });

  const testFlow = [
    {
      id: "kalman",
      type: "kalman-noise-filter",
      r: 0.05,
      q: 1.2,
      wires: [["spy"]],
    },
    {
      id: "spy",
      type: "helper",
    },
  ];

  it("should filter data with number payloads", function (done) {
    helper.load(kalmanNode, testFlow, function () {
      const kalman = helper.getNode("kalman");
      const spy = helper.getNode("spy");

      const [clean, noisy] = getTestData();
      const filtered = [];

      spy.on("input", function ({ payload }) {
        filtered.push(payload);

        // perform assertion when last value is processed
        if (filtered.length == noisy.length) {
          const inputError = sumOfSquaredErrors(clean, noisy);
          const filteredError = sumOfSquaredErrors(clean, filtered);
          try {
            filteredError.should.be.below(
              inputError,
              `Filtered data has total error ${filteredError}, which is not less than noisy data's total error ${inputError}`
            );
            done();
          } catch (error) {
            done(error);
          }
        }
      });

      noisy.map(function (payload) {
        kalman.receive({ payload });
      });
    });
  });

  it("should filter data with array payload", function (done) {
    helper.load(kalmanNode, testFlow, function () {
      const kalman = helper.getNode("kalman");
      const spy = helper.getNode("spy");

      const [clean, noisy] = getTestData();

      spy.on("input", function ({ payload }) {
        const inputError = sumOfSquaredErrors(clean, noisy);
        const filteredError = sumOfSquaredErrors(clean, payload);
        try {
          filteredError.should.be.below(
            inputError,
            `Filtered data has total error ${filteredError}, which is not less than noisy data's total error ${inputError}`
          );
          done();
        } catch (error) {
          done(error);
        }
      });

      kalman.receive({ payload: noisy });
    });
  });
});

function generateNoisyData({ size, mean, processNoise, measurementNoise }) {
  const processData = [...Array(size).keys()].map(() =>
    gaussianRandom({ mean, stdDeviation: processNoise })
  );
  return [
    processData,
    processData.map(
      (v) => v + gaussianRandom({ stdDeviation: measurementNoise })
    ),
  ];
}

function sumOfSquaredErrors(array1, array2) {
  return array1
    .map((val, index) => val - array2[index])
    .map((delta) => delta * delta)
    .reduce((a, b) => a + b, 0);
}

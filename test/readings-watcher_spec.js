let helper = require("node-red-node-test-helper");
let readingswatcher = require("../readings-watcher/readings-watcher.js");

helper.init(require.resolve("node-red"));

let testflow = [];

describe("readings-watcher node", function () {
  beforeEach(function (done) {
    testflow = [
      {
        id: "watcher",
        type: "readings-watcher",
        name: "readings-watcher",
        wires: [["ok"], ["error"]],
      },
      { id: "ok", type: "helper" },
      { id: "error", type: "helper" },
    ];
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function (done) {
    helper.load(readingswatcher, testflow, function () {
      let watcher = helper.getNode("watcher");
      try {
        watcher.should.have.property("name", "readings-watcher");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should report if input is not a number", function (done) {
    helper.load(readingswatcher, testflow, function () {
      let watcher = helper.getNode("watcher");

      watcher.receive({ payload: "NaN" });
      setTimeout(() => {
        try {
          watcher.warn.should.be.calledOnce();
          done();
        } catch (error) {
          done(error);
        }
      }, 10);
    });
  });

  it("should allow consecutive readings when using 'minchange' and their values are sufficiently different", function (done) {
    let messageSequence = [1, 1.5];
    let minchange = 0.1;
    minchange.should.be.lessThan(
      Math.abs(messageSequence[0] - messageSequence[1]) / messageSequence[0]
    );
    testflow[0].strategyMask = 1;
    testflow[0].minchange = minchange;

    helper.load(readingswatcher, testflow, function () {
      let watcher = helper.getNode("watcher");
      let ok = helper.getNode("ok");
      let receivedMsgs = 0;

      ok.on("input", function (msg) {
        try {
          msg.payload.should.equal(messageSequence[receivedMsgs++]);
          if (receivedMsgs == messageSequence.length) done();
        } catch (err) {
          done(err);
        }
      });

      messageSequence.forEach((element) => {
        watcher.receive({ payload: element });
      });
    });
  });

  it("should allow consecutive readings when using 'maxchange' and their values are sufficiently similar", function (done) {
    let messageSequence = [0.9, 1.1];
    let maxchange = 0.5;
    maxchange.should.be.greaterThan(
      Math.abs(messageSequence[0] - messageSequence[1]) / messageSequence[0]
    );
    testflow[0].strategyMask = 2;
    testflow[0].maxchange = maxchange;

    helper.load(readingswatcher, testflow, function () {
      let watcher = helper.getNode("watcher");
      let ok = helper.getNode("ok");
      let receivedMsgs = 0;

      ok.on("input", function (msg) {
        try {
          msg.payload.should.equal(messageSequence[receivedMsgs++]);
          if (receivedMsgs == messageSequence.length) done();
        } catch (err) {
          done(err);
        }
      });

      messageSequence.forEach((element) => {
        watcher.receive({ payload: element });
      });
    });
  });

  it("should allow consecutive readings when using 'stucklimit' and the last 'X' values are not all exactly equal", function (done) {
    let messageSequence = [1, 1, 1, 2, 1, 1];
    let stucklimit = 4;
    testflow[0].strategyMask = 4;
    testflow[0].stucklimit = stucklimit;

    helper.load(readingswatcher, testflow, function () {
      let watcher = helper.getNode("watcher");
      let ok = helper.getNode("ok");
      let receivedMsgs = 0;

      ok.on("input", function (msg) {
        try {
          msg.payload.should.equal(messageSequence[receivedMsgs++]);
          if (receivedMsgs == messageSequence.length) done();
        } catch (err) {
          done(err);
        }
      });

      messageSequence.forEach((element) => {
        watcher.receive({ payload: element });
      });
    });
  });

  it("should trigger an error when using 'minchange' and consecutive readings are too similar", function (done) {
    let messageSequence = [1, 1.05];
    let minchange = 0.1;
    minchange.should.be.greaterThanOrEqual(
      Math.abs(messageSequence[0] - messageSequence[1]) / messageSequence[0]
    );
    testflow[0].strategyMask = 1;
    testflow[0].minchange = minchange;

    helper.load(readingswatcher, testflow, function () {
      let watcher = helper.getNode("watcher");
      let ok = helper.getNode("ok");
      let error = helper.getNode("error");
      let receivedMsgs = 0;

      ok.on("input", function (msg) {
        try {
          msg.payload.should.equal(messageSequence[receivedMsgs++]);
        } catch (err) {
          done(err);
        }
      });

      error.on("input", function (msg) {
        try {
          msg.payload.should.equal(messageSequence[receivedMsgs++]);
          receivedMsgs.should.be.equal(messageSequence.length);
          done();
        } catch (err) {
          done(err);
        }
      });

      messageSequence.forEach((element) => {
        watcher.receive({ payload: element });
      });
    });
  });

  it("should trigger an error when using 'maxchange' and consecutive readings are too different", function (done) {
    let messageSequence = [0.3, 0.5];
    let maxchange = 0.65;
    maxchange.should.be.lessThanOrEqual(
      Math.abs(messageSequence[0] - messageSequence[1]) / messageSequence[0]
    );
    testflow[0].strategyMask = 2;
    testflow[0].maxchange = maxchange;

    helper.load(readingswatcher, testflow, function () {
      let watcher = helper.getNode("watcher");
      let ok = helper.getNode("ok");
      let error = helper.getNode("error");
      let receivedMsgs = 0;

      ok.on("input", function (msg) {
        try {
          msg.payload.should.equal(messageSequence[receivedMsgs++]);
        } catch (err) {
          done(err);
        }
      });

      error.on("input", function (msg) {
        try {
          msg.payload.should.equal(messageSequence[receivedMsgs++]);
          receivedMsgs.should.be.equal(messageSequence.length);
          done();
        } catch (err) {
          done(err);
        }
      });

      messageSequence.forEach((element) => {
        watcher.receive({ payload: element });
      });
    });
  });

  it("should trigger an error when using 'stucklimit' and the last 'X' consecutive readings are equal", function (done) {
    let messageSequence = [1, 1, 1, 1, 1];
    let stucklimit = messageSequence.length;
    testflow[0].strategyMask = 4;
    testflow[0].stucklimit = stucklimit;

    helper.load(readingswatcher, testflow, function () {
      let watcher = helper.getNode("watcher");
      let ok = helper.getNode("ok");
      let error = helper.getNode("error");
      let receivedMsgs = 0;

      ok.on("input", function (msg) {
        try {
          msg.payload.should.equal(messageSequence[receivedMsgs++]);
        } catch (err) {
          done(err);
        }
      });

      error.on("input", function (msg) {
        try {
          msg.payload.should.equal(messageSequence[receivedMsgs++]);
          receivedMsgs.should.be.equal(stucklimit);
          done();
        } catch (err) {
          done(err);
        }
      });

      messageSequence.forEach((element) => {
        watcher.receive({ payload: element });
      });
    });
  });
});

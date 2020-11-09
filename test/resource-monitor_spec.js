const helper = require("node-red-node-test-helper");
const sinon = require("sinon");
const resourceMonitorNode = require("../resource-monitor/resource-monitor.js");

helper.init(require.resolve("node-red"));

describe("resource-mointor Node", function () {
  let testflow;
  let clock;

  beforeEach(function (done) {
    testflow = [
      {
        id: "monitor",
        type: "resource-monitor",
        name: "resource-monitor",
        wires: [["all"], ["CPU"], ["RAM"], ["storage"], ["battery"]],
      },
      { id: "all", type: "helper" },
      { id: "CPU", type: "helper" },
      { id: "RAM", type: "helper" },
      { id: "storage", type: "helper" },
      { id: "battery", type: "helper" },
    ];
    helper.startServer(done);
    clock = sinon.useFakeTimers();
  });

  afterEach(function (done) {
    clock.restore();
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function (done) {
    helper.load(resourceMonitorNode, testflow, function () {
      const monitor = helper.getNode("monitor");

      try {
        monitor.should.have.property("name", "resource-monitor");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should report if input is not a JSON object", function (done) {
    helper.load(resourceMonitorNode, testflow, function () {
      let monitor = helper.getNode("monitor");

      try {
        monitor.receive({ payload: 12 });
        clock.tick(100);
        monitor.error.should.be.calledWith(
          "Error: Input must be a JSON object with resources usage."
        );
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should report if CPU is selected and a corresponding value is not sent in input", function (done) {
    testflow[0].resourcesMask = 8;
    helper.load(resourceMonitorNode, testflow, function () {
      let monitor = helper.getNode("monitor");

      try {
        monitor.receive({ payload: {} });
        clock.tick(100);
        monitor.error.should.be.calledWith(
          "Error: Value received for CPU must be a number between 0 and 100! If this value isn't supposed to be monitored uncheck it in node's properties."
        );
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should report if CPU is selected and the corresponding value in input is not a number", function (done) {
    testflow[0].resourcesMask = 8;
    helper.load(resourceMonitorNode, testflow, function () {
      let monitor = helper.getNode("monitor");

      try {
        monitor.receive({ payload: { CPU: "3" } });
        clock.tick(100);
        monitor.error.should.be.calledOnce();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should report if RAM is selected and the corresponding value in input is not a number", function (done) {
    testflow[0].resourcesMask = 4;
    helper.load(resourceMonitorNode, testflow, function () {
      let monitor = helper.getNode("monitor");

      try {
        monitor.receive({ payload: { RAN: "3" } });
        clock.tick(100);
        monitor.error.should.be.calledOnce();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should report if storage is selected and the corresponding value in input is not a number", function (done) {
    testflow[0].resourcesMask = 2;
    helper.load(resourceMonitorNode, testflow, function () {
      let monitor = helper.getNode("monitor");

      try {
        monitor.receive({ payload: { storage: "3" } });
        clock.tick(100);
        monitor.error.should.be.calledOnce();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should report if battery is selected and the corresponding value in input is not a number", function (done) {
    testflow[0].resourcesMask = 1;

    helper.load(resourceMonitorNode, testflow, function () {
      let monitor = helper.getNode("monitor");

      try {
        monitor.receive({ payload: { battery: "3" } });
        clock.tick(100);
        monitor.error.should.be.calledOnce();
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

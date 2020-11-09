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
      const monitor = helper.getNode("monitor");

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
      const monitor = helper.getNode("monitor");

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
      const monitor = helper.getNode("monitor");

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
      const monitor = helper.getNode("monitor");

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
      const monitor = helper.getNode("monitor");

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
      const monitor = helper.getNode("monitor");

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

  it("should report that CPU is within limits", function (done) {
    testflow[0].resourcesMask = 8;
    testflow[0].maxCPU = 50;

    helper.load(resourceMonitorNode, testflow, function () {
      const monitor = helper.getNode("monitor");
      try {
        monitor.receive({
          payload: { CPU: 34 },
        });
        clock.tick(100);

        monitor.status.should.be.calledWithExactly({
          fill: "green",
          shape: "dot",
          text: "Within limits",
        });
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should send message through 'CPU too high' and 'resource(s) out of bounds' outputs", function (done) {
    testflow[0].resourcesMask = 8;
    testflow[0].maxCPU = 50;

    helper.load(resourceMonitorNode, testflow, function () {
      const monitor = helper.getNode("monitor");
      const allOutput = helper.getNode("all");
      const CPUOutput = helper.getNode("CPU");

      const allSpy = sinon.spy();
      const CPUSpy = sinon.spy();

      allOutput.on("input", function (msg) {
        try {
          allSpy();
          msg.payload.should.equal(
            "At least one of the resources monitored is out of bounds!"
          );
          msg.type.should.have.property("CPU", "too high");
        } catch (err) {
          done(err);
        }
      });

      CPUOutput.on("input", function (msg) {
        try {
          CPUSpy();
          msg.payload.should.equal("CPU usage too high");
        } catch (err) {
          done(err);
        }
      });

      monitor.receive({
        payload: { CPU: 64 },
      });

      clock.tick(100);

      try {
        allSpy.callCount.should.be.equal(1);
        CPUSpy.callCount.should.be.equal(1);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should report that RAM is within limits", function (done) {
    testflow[0].resourcesMask = 4;
    testflow[0].maxRAM = 50;

    helper.load(resourceMonitorNode, testflow, function () {
      const monitor = helper.getNode("monitor");
      try {
        monitor.receive({
          payload: { RAM: 34 },
        });
        clock.tick(100);

        monitor.status.should.be.calledWithExactly({
          fill: "green",
          shape: "dot",
          text: "Within limits",
        });
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should send message through 'RAM too high' and 'resource(s) out of bounds' outputs", function (done) {
    testflow[0].resourcesMask = 4;
    testflow[0].maxRAM = 50;

    helper.load(resourceMonitorNode, testflow, function () {
      const monitor = helper.getNode("monitor");
      const allOutput = helper.getNode("all");
      const RAMOutput = helper.getNode("RAM");

      const allSpy = sinon.spy();
      const RAMSpy = sinon.spy();

      allOutput.on("input", function (msg) {
        try {
          allSpy();
          msg.payload.should.equal(
            "At least one of the resources monitored is out of bounds!"
          );
          msg.type.should.have.property("RAM", "too high");
        } catch (err) {
          done(err);
        }
      });

      RAMOutput.on("input", function (msg) {
        try {
          RAMSpy();
          msg.payload.should.equal("RAM usage too high");
        } catch (err) {
          done(err);
        }
      });

      monitor.receive({
        payload: { RAM: 64 },
      });

      clock.tick(100);

      try {
        allSpy.callCount.should.be.equal(1);
        RAMSpy.callCount.should.be.equal(1);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should report that storage is within limits", function (done) {
    testflow[0].resourcesMask = 2;
    testflow[0].maxStorage = 50;

    helper.load(resourceMonitorNode, testflow, function () {
      const monitor = helper.getNode("monitor");
      try {
        monitor.receive({
          payload: { storage: 34 },
        });
        clock.tick(100);

        monitor.status.should.be.calledWithExactly({
          fill: "green",
          shape: "dot",
          text: "Within limits",
        });
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should send message through 'storage too high' and 'resource(s) out of bounds' outputs", function (done) {
    testflow[0].resourcesMask = 2;
    testflow[0].maxStorage = 50;

    helper.load(resourceMonitorNode, testflow, function () {
      const monitor = helper.getNode("monitor");
      const allOutput = helper.getNode("all");
      const storageOutput = helper.getNode("storage");

      const allSpy = sinon.spy();
      const storageSpy = sinon.spy();

      allOutput.on("input", function (msg) {
        try {
          allSpy();
          msg.payload.should.equal(
            "At least one of the resources monitored is out of bounds!"
          );
          msg.type.should.have.property("storage", "too high");
        } catch (err) {
          done(err);
        }
      });

      storageOutput.on("input", function (msg) {
        try {
          storageSpy();
          msg.payload.should.equal("Storage usage too high");
        } catch (err) {
          done(err);
        }
      });

      monitor.receive({
        payload: { storage: 64 },
      });

      clock.tick(100);

      try {
        allSpy.callCount.should.be.equal(1);
        storageSpy.callCount.should.be.equal(1);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should report that battery is within limits", function (done) {
    testflow[0].resourcesMask = 1;
    testflow[0].minBattery = 50;

    helper.load(resourceMonitorNode, testflow, function () {
      const monitor = helper.getNode("monitor");
      try {
        monitor.receive({
          payload: { battery: 70 },
        });
        clock.tick(100);

        monitor.status.should.be.calledWithExactly({
          fill: "green",
          shape: "dot",
          text: "Within limits",
        });
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should send message through 'battery too low' and 'resource(s) out of bounds' outputs", function (done) {
    testflow[0].resourcesMask = 1;
    testflow[0].minBattery = 50;

    helper.load(resourceMonitorNode, testflow, function () {
      const monitor = helper.getNode("monitor");
      const allOutput = helper.getNode("all");
      const batteryOutput = helper.getNode("battery");

      const allSpy = sinon.spy();
      const batterySpy = sinon.spy();

      allOutput.on("input", function (msg) {
        try {
          allSpy();
          msg.payload.should.equal(
            "At least one of the resources monitored is out of bounds!"
          );
          msg.type.should.have.property("battery", "too low");
        } catch (err) {
          done(err);
        }
      });

      batteryOutput.on("input", function (msg) {
        try {
          batterySpy();
          msg.payload.should.equal("Battery level too low");
        } catch (err) {
          done(err);
        }
      });

      monitor.receive({
        payload: { battery: 30 },
      });

      clock.tick(100);

      try {
        allSpy.callCount.should.be.equal(1);
        batterySpy.callCount.should.be.equal(1);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

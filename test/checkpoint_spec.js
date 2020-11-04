let helper = require("node-red-node-test-helper");
let checkpointNode = require("../checkpoint/checkpoint.js");

helper.init(require.resolve("node-red"));

describe("checkpoint node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function (done) {
    let flow = [
      {
        id: "n1",
        type: "checkpoint",
        name: "checkpoint",
      },
    ];

    helper.load(checkpointNode, flow, function () {
      let n1 = helper.getNode("n1");
      try {
        n1.should.have.property("name", "checkpoint");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should clear local context", function (done) {
    let flow = [
      {
        id: "n1",
        type: "checkpoint",
        name: "checkpoint",
      },
    ];

    helper.load(checkpointNode, flow, function () {
      let n1 = helper.getNode("n1");
      n1.emit("reset");
      try {
        let active = n1.context().get("active", "file");
        let lastMsg = n1.context().get("lastMsg", "file");
        let timestamp = n1.context().get("timestamp", "file");
        if (
          active === undefined &&
          lastMsg === undefined &&
          timestamp === undefined
        ) {
          done();
        } else {
          done("Local context was not reset");
        }
      } catch (error) {
        done(error);
      }
    });
  });

  it("should redirect message to output", function (done) {
    let flow = [
      {
        id: "n1",
        type: "checkpoint",
        name: "checkpoint",
        wires: [["n2"]],
      },
      {
        id: "n2",
        type: "helper",
        name: "output-from-test-node",
      },
    ];

    helper.load(checkpointNode, flow, function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");

      let payload = 42;

      n2.on("input", (msg) => {
        try {
          msg.should.have.property("payload", payload);
          done();
        } catch (err) {
          done(err);
        }
      });

      n1.receive({ payload: payload });
    });
  });

  it("should update local storage", function (done) {
    let flow = [
      {
        id: "n1",
        type: "checkpoint",
        name: "checkpoint",
        wires: [["n2"]],
      },
      {
        id: "n2",
        type: "helper",
        name: "output-from-test-node",
      },
    ];

    helper.load(checkpointNode, flow, function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");

      let payload = 42;

      n2.on("input", () => {
        try {
          let active = n1.context().get("active", "file");
          let lastMsg = n1.context().get("lastMsg", "file");
          let timestamp = n1.context().get("timestamp", "file");
          if (active && lastMsg.payload === 42 && Number.isInteger(timestamp)) {
            done();
          } else {
            done("Local context was not updated");
          }
        } catch (err) {
          done(err);
        }
      });

      n1.receive({ payload: payload });
    });
  });

  it("should resend message after restart event", function (done) {
    let flow = [
      {
        id: "n1",
        type: "checkpoint",
        name: "checkpoint",
        ttl: 3600,
        wires: [["n2"]],
      },
      {
        id: "n2",
        type: "helper",
        name: "output-from-test-node",
      },
    ];

    helper.load(checkpointNode, flow, function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");

      let payload = 42;
      let count = 0;

      n2.on("input", (msg) => {
        try {
          msg.should.have.property("payload", 42);
          count++;
          if (count == 2) {
            done();
          }
        } catch (err) {
          done(err);
        }
      });

      n1.receive({ payload: payload });
      setTimeout(() => {
        n1.emit("restart");
      }, 30);
    });
  });
});

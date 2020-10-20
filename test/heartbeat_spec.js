let helper = require("node-red-node-test-helper");
let heartbeatNode = require("../heartbeat/heartbeat.js");

helper.init(require.resolve("node-red"));

describe("heartbeat node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function (done) {
    let testFlow = [{ id: "node1", type: "heartbeat", name: "heartbeat" }];

    // Load flow and start it
    helper.load(heartbeatNode, testFlow, function () {
      let myTestNode = helper.getNode("node1");

      try {
        myTestNode.should.have.property("name", "heartbeat");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should send status message (http)", function (done) {
    let testFlow = [
      {
        id: "node1",
        type: "heartbeat",
        name: "heartbeat",
        frequency: "1",
        protocol: "http",
        onfail: false,
        httpendpoint: "https://www.fe.up.pt",
        wires: [["node2"]],
      },
      { id: "node2", type: "helper" },
    ];

    helper.load(heartbeatNode, testFlow, function () {
      let node2 = helper.getNode("node2");

      node2.on("input", function (msg, _send, _done) {
        try {
          msg.payload.should.have.property("status", 200);
          msg.payload.should.have.property("statusMessage", "OK");
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  it("should send error status (http)", function (done) {
    let testFlow = [
      {
        id: "node1",
        type: "heartbeat",
        name: "heartbeat",
        frequency: "1",
        protocol: "http",
        onfail: false,
        httpendpoint: "https://www.webamil.fe.up.pt",
        wires: [["node2"]],
      },
      { id: "node2", type: "helper" },
    ];

    helper.load(heartbeatNode, testFlow, function () {
      let node2 = helper.getNode("node2");

      node2.on("input", function (msg, _send, _done) {
        try {
          msg.payload.should.have.property("status", 0);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  it("should send status message (mqtt)", function (done) {
    let testFlow = [
      {
        id: "node1",
        type: "heartbeat",
        name: "heartbeat",
        frequency: "1",
        protocol: "mqtt",
        onfail: false,
        httpendpoint: "https://www.fe.up.pt",
        wires: [["node2"]],
      },
      { id: "node2", type: "helper" },
    ];

    helper.load(heartbeatNode, testFlow, function () {
      let node1 = helper.getNode("node1");
      let node2 = helper.getNode("node2");

      node2.on("input", function (msg, _send, _done) {
        try {
          msg.payload.should.have.property("status", 200);
          msg.payload.should.have.property("statusMessage", "Alive");
          done();
        } catch (error) {
          done(error);
        }
      });

      node1.receive();
    });
  });
});

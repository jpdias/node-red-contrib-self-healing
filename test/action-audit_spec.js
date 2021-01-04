let helper = require("node-red-node-test-helper");
let actionAuditNode = require("../action-audit/action-audit.js");

helper.init(require.resolve("node-red"));

describe("action-audit node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  const genericFlow = [
    {
      id: "n1",
      type: "action-audit",
      name: "action-audit",
      duration: 1,
      wires: [["n2"], ["n3"], ["n4"]],
    },
    {
      id: "n2",
      type: "helper",
      name: "success-from-test-node",
    },
    {
      id: "n3",
      type: "helper",
      name: "error-from-test-node",
    },
    {
      id: "n4",
      type: "helper",
      name: "exception-from-test-node",
    },
  ];

  it("should be loaded", function (done) {
    const flow = [
      {
        id: "n1",
        type: "action-audit",
        name: "action-audit",
      },
    ];

    helper.load(actionAuditNode, flow, function () {
      const n1 = helper.getNode("n1");
      try {
        n1.should.have.property("name", "action-audit");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should acknowledge single action and redirect to success output", function (done) {
    helper.load(actionAuditNode, genericFlow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");

      const actionMsg = {
        payload: "Very cool and amazing test wow",
        action: "Turn on lights",
      };

      const ackMsg = {
        ack: "Confirming lights are on",
      };

      n2.on("input", (msg) => {
        try {
          msg.should.have.property("action", actionMsg.action);
          done();
        } catch (err) {
          done(err);
        }
      });

      n1.receive(actionMsg);
      n1.receive(ackMsg);
    });
  });

  it("should not acknowledge single action and redirect to error output", function (done) {
    helper.load(actionAuditNode, genericFlow, function () {
      const n1 = helper.getNode("n1");
      const n3 = helper.getNode("n3");

      const actionMsg = {
        payload: "Very cool and amazing test wow",
        action: "Turn on lights",
      };

      n3.on("input", (msg) => {
        try {
          msg.should.have.property("error");
          done();
        } catch (err) {
          done(err);
        }
      });

      n1.receive(actionMsg);
    });
  });

  it("should acknowledge multiple action and redirect to success output", function (done) {
    helper.load(actionAuditNode, genericFlow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");

      let acksNeeded = 3;

      const actionMsg = {
        payload: "Very cool and amazing test wow",
        action: "Turn on lights",
      };

      const ackMsg = {
        ack: "Confirming lights are on",
      };

      n2.on("input", (msg) => {
        acksNeeded--;
        try {
          msg.should.have.property("action", actionMsg.action);
          if (acksNeeded == 0) done();
        } catch (err) {
          done(err);
        }
      });

      n1.receive(actionMsg);
      n1.receive(ackMsg);
      n1.receive(actionMsg);
      n1.receive(actionMsg);
      n1.receive(ackMsg);
      n1.receive(ackMsg);
    });
  });

  it("should not acknowledge action after multiples acks and redirect to error output", function (done) {
    helper.load(actionAuditNode, genericFlow, function () {
      const n1 = helper.getNode("n1");
      const n3 = helper.getNode("n3");

      const actionMsg = {
        payload: "Very cool and amazing test wow",
        action: "Turn on lights",
      };

      const ackMsg = {
        ack: "Confirming lights are on",
      };

      n3.on("input", (msg) => {
        try {
          msg.should.have.property("error");
          done();
        } catch (err) {
          done(err);
        }
      });

      n1.receive(actionMsg);
      n1.receive(ackMsg);
      n1.receive(actionMsg);
      n1.receive(actionMsg);
      n1.receive(ackMsg);
    });
  });

  it("should redirect to exception output when input has no action/ack field", function (done) {
    helper.load(actionAuditNode, genericFlow, function () {
      const n1 = helper.getNode("n1");
      const n4 = helper.getNode("n4");

      const actionMsg = {
        payload: "Very cool and amazing test wow",
        notAction: "Turn on lights",
      };

      n4.on("input", (msg) => {
        try {
          msg.should.have.property(
            "exception",
            "Msg has neither action or ack field"
          );
          done();
        } catch (err) {
          done(err);
        }
      });

      n1.receive(actionMsg);
    });
  });

  it("should redirect to exception output when ack is received with no queued actions", function (done) {
    helper.load(actionAuditNode, genericFlow, function () {
      const n1 = helper.getNode("n1");
      const n4 = helper.getNode("n4");

      const ackMsg = {
        ack: "Confirming lights are on",
      };

      n4.on("input", (msg) => {
        try {
          msg.should.have.property(
            "exception",
            "Received ack with no queued actions"
          );
          done();
        } catch (err) {
          done(err);
        }
      });

      n1.receive(ackMsg);
    });
  });
});

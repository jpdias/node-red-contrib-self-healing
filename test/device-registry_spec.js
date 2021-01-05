let helper = require("node-red-node-test-helper");
let sinon = require("sinon");
let deviceRegistryNode = require("../device-registry/device-registry.js");

let clock;

helper.init(require.resolve("node-red"));

function setupFlow() {
  let testFlow = [
    {
      id: "dr",
      type: "device-registry",
      name: "Device Registry",
      wires: [["list"], ["add"], ["remove"]],
    },
    { id: "list", type: "helper" },
    { id: "add", type: "helper" },
    { id: "remove", type: "helper" },
  ];
  return testFlow;
}

describe("device-registry node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
    clock = sinon.useFakeTimers();
  });

  afterEach(function (done) {
    clock.restore();
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function (done) {
    let flow = [
      {
        id: "n1",
        type: "device-registry",
        name: "Device Registry",
      },
    ];

    helper.load(deviceRegistryNode, flow, function () {
      let n1 = helper.getNode("n1");
      try {
        n1.should.have.property("name", "Device Registry");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should add one device", function (done) {
    let flow = setupFlow();

    helper.load(deviceRegistryNode, flow, function () {
      let deviceRegistry = helper.getNode("dr");
      let allDevices = helper.getNode("list");
      let newDevice = helper.getNode("add");
      let removeDevice = helper.getNode("remove");

      let allDevicesSpy = sinon.spy();
      let newDeviceSpy = sinon.spy();
      let removeDeviceSpy = sinon.spy();

      newDevice.on("input", function (msg) {
        try {
          msg.should.have.property("payload");
          msg.payload.should.have.property("Id");
          msg.payload.Id.should.equal("1");
          msg.payload.Ip.should.equal("192.160.111");
          newDeviceSpy();
        } catch (error) {
          done(error);
        }
      });

      allDevices.on("input", function (msg) {
        try {
          msg.payload.length.should.equal(1);
          const device = msg.payload[0];
          device.should.have.property("Id");
          device.Id.should.equal("1");
          device.Ip.should.equal("192.160.111");
          allDevicesSpy();
        } catch (error) {
          done(error);
          return;
        }
      });

      removeDevice.on("input", removeDeviceSpy);

      deviceRegistry.receive({
        payload: [
          { Id: "1", Name: "FireSensor", Ip: "192.160.111", Status: "on" },
        ],
      });
      clock.tick(150);

      try {
        removeDeviceSpy.should.not.be.called();
        newDeviceSpy.should.be.calledOnce();
        allDevicesSpy.should.be.calledOnce();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should remove one device", function (done) {
    let flow = setupFlow();

    helper.load(deviceRegistryNode, flow, function () {
      let deviceRegistry = helper.getNode("dr");
      let allDevices = helper.getNode("list");
      let newDevice = helper.getNode("add");
      let removeDevice = helper.getNode("remove");

      let allDevicesSpy = sinon.spy();
      let newDeviceSpy = sinon.spy();
      let removeDeviceSpy = sinon.spy();

      newDevice.on("input", function (msg) {
        try {
          msg.should.have.property("payload");
          msg.payload.should.have.property("Id");
          msg.payload.Id.should.equal("1");
          msg.payload.Ip.should.equal("192.160.111");
          msg.payload.Status.should.equal("on");
          newDeviceSpy();
        } catch (error) {
          done(error);
        }
      });

      allDevices.on("input", allDevicesSpy);

      removeDevice.on("input", function (msg) {
        try {
          msg.should.have.property("payload");
          msg.payload.should.have.property("Id");
          msg.payload.Id.should.equal("1");
          msg.payload.Ip.should.equal("192.160.111");
          msg.payload.Status.should.equal("off");
          removeDeviceSpy();
        } catch (error) {
          done(error);
          return;
        }
      });

      deviceRegistry.receive({
        payload: [
          { Id: "1", Name: "FireSensor", Ip: "192.160.111", Status: "on" },
        ],
      });
      clock.tick(150);
      deviceRegistry.receive({
        payload: [
          { Id: "1", Name: "FireSensor", Ip: "192.160.111", Status: "off" },
        ],
      });
      clock.tick(150);

      try {
        removeDeviceSpy.should.be.calledOnce();
        newDeviceSpy.should.be.calledOnce();
        allDevicesSpy.should.be.calledTwice();
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

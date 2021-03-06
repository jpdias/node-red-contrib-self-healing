const { Builder, By, until } = require("selenium-webdriver");
const { spawn } = require("child_process");
require("should");

describe("action-audit node", async function () {
  this.timeout(0);
  let driver;
  let proc;
  const testPort = "8090";
  const actuatorXpath =
    "//*[text()='actuator']/../preceding-sibling::*[contains(@class, 'red-ui-flow-node-button')]/*[contains(@class, 'red-ui-flow-node-button-button')]";
  const sensorXpath =
    "//*[text()='sensor']/../preceding-sibling::*[contains(@class, 'red-ui-flow-node-button')]/*[contains(@class, 'red-ui-flow-node-button-button')]";

  it("should be test action-audit", async function () {
    driver = await new Builder()
      .forBrowser("firefox")
      .usingServer("http://selenium:4444/wd/hub")
      .build();

    const testJson = "test-acceptance/action-audit.json";
    proc = spawn("node-red", ["-p", testPort, testJson], {
      detached: true,
    });

    try {
      await driver.sleep(5000); //TODO: Switch with elementIsVisible
      await driver.get("http://nodered:8090");

      await driver.sleep(2000); //TODO: Switch with elementIsVisible
      await driver
        .wait(until.elementLocated(By.xpath(actuatorXpath)), 10000)
        .click();
      await driver
        .wait(until.elementLocated(By.xpath(sensorXpath)), 10000)
        .click();

      await driver
        .wait(
          until.elementLocated(By.id("red-ui-tab-debug-link-button")),
          10000
        )
        .click();

      let debugPanel = await driver.wait(
        until.elementLocated(
          By.className("red-ui-debug-content red-ui-debug-content-list")
        ),
        10000
      );

      let firstMsg = await debugPanel.findElement(
        By.css(".red-ui-debug-msg .red-ui-debug-msg-row")
      );

      const msgText = await firstMsg.getAttribute("textContent");
      const msg = eval("(" + msgText + ")");

      msg.should.have.property("action", "Turn light on");
      msg.should.have.property("payload", "hello");
    } finally {
      process.kill(-proc.pid);
      await driver.quit();
    }
  });
});

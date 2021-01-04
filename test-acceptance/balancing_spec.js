/*
  Docker container to run selenium.
  Next sprint: Try to streamline this part of the test setup

  docker run --rm -p 9001:4444 -p 9002:5900 -d --shm-size 2g selenium/standalone-firefox-debug
*/

const { Builder, By, until } = require("selenium-webdriver");
const { spawn } = require("child_process");
require("should");

describe("balancing node", async function () {
  this.timeout(0);
  let driver;
  let proc;
  const testPort = "8090";
  const injectXpath =
    "//*[text()='Inject']/../preceding-sibling::*[contains(@class, 'red-ui-flow-node-button')]/*[contains(@class, 'red-ui-flow-node-button-button')]";

  it("should be test checkpoint", async function () {
    driver = await new Builder()
      .forBrowser("firefox")
      .usingServer("http://selenium:4444/wd/hub")
      .build();

    const testJson = "test-acceptance/balancing.json";
    proc = spawn("node-red", ["-p", testPort, testJson], {
      detached: true,
    });

    try {
      await driver.sleep(5000);
      await driver.get("http://nodered:8090");

      await driver.sleep(2000);
      let button = await driver.wait(
        until.elementLocated(By.xpath(injectXpath)),
        10000
      );

      await driver
        .wait(
          until.elementLocated(By.id("red-ui-tab-debug-link-button")),
          10000
        )
        .click();

      button.click();
      button.click();

      let debugPanel = await driver.wait(
        until.elementLocated(
          By.className("red-ui-debug-content red-ui-debug-content-list")
        ),
        10000
      );

      let messageArray = await debugPanel.findElements(
        By.css(".red-ui-debug-msg-name")
      );

      await driver.sleep(100);
      let debug1 = await messageArray[0].getAttribute("textContent");
      let debug2 = await messageArray[1].getAttribute("textContent");

      debug1.should.be.equal("node: Debug1");
      debug2.should.be.equal("node: Debug2");
    } finally {
      process.kill(-proc.pid);
      await driver.quit();
    }
  });
});

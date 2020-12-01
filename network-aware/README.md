### Objective

A node to continuously scan the network to find new or removed devices,
using arp tables. Can be combined with the device-registry node.

### Properties

  <dl class="message-properties">
    <dt>name: string</dt>
    <dd>Name of node to be displayed in editor.</dd>
    <dt>baseip: string</dt>
    <dd>Network IP to be scanned.</dd>
    <dt>scanInterval: number</dt>
    <dd>Time interval between scans, in seconds.</dd>
  </dl>

### Inputs

  <dl class="message-properties">
    <p>Any message.</p>
  </dl>

### Outputs

  <dl class="message-properties">
    <p>
      If a scanned device has a valid MAC address, a message is fowarded to
      allDevices output containing the device information.
    </p>
    <p>
      Otherwise, it is sent to unknownDevices output but without the device id
      field.
    </p>
  </dl>

### Details

  <p>
    Collects information about the devices connected to the network, using arp
    tables. This information contains the device id (generated using MAC and IP
    adresses), ip address, name, manufacturer and timestamp of when it was
    scanned.
  </p>

### Example Flow

![](../samples/network-aware.png)

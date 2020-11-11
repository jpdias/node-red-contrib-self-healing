### Objective

A node to enable or disable a Node-RED flow during runtime (local or remote
instances, using the available REST API).

### Details

### Properties

<dt>name: string</dt>
<dd>Name of node to be displayed in editor.</dd>

<dt>targetHost: string</dt>
<dd>Host on which the flow can be found.</dd>

<dt>targetPort: number</dt>
<dd>Port number on which the flow can be found.</dd>

<dt>targetFlow: </dt>
<dd>Id of the flow to enable/disable.</dd>

### Inputs

<dt>payload: boolean</dt>
<dd>True to enable flow, false otherwise.</dd>

### Outputs

<dt>flow: string</dt>
<dd>Id of the flow changed.</dd>

<dt>disabled: boolean</dt>
<dd>Set to true if flow is disabled, set to false otherwise.</dd>

### Example Flow

![](../samples/flow-control.png)

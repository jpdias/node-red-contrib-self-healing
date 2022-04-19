### Objective

A node that tags a sensor reading with a confidence level.

### Details

This node can be placed right after an "mqtt in" node subscribed to a topic for a given sensor's readings. The node receives an absolute measurement uncertainty and the confidence degree used to calculate the uncertainty, normally issued by the sensor's manufacturer, as an initial parameter. Both of these values are added as entries to the msg object.

### Properties

<dl class="message-properties">
    
<dt>name<span class="property-type">: string</span></dt>

<dd>name of node to be displayed in editor</dd>

<dt>measurement uncertainty<span class="property-type">: integer</span></dt>
    
<dd>the sensor's absolute measurement uncertainty, in the same unit as the sensor readings </dd>

<dt>confidence degree<span class="property-type">percentage</span></dt>

<dd>the sensor's confidence degree used to calculate the measurement uncertainty</dd>
  
</dl>

### Inputs

<dl class="message-properties">Any input in which the payload is a number</dl>

### Outputs

<dl class="message-properties"> Equal to the last message object sent as input but with additional <b>uncertainty</b> and <b>confidence</b> fields </dl>

### Example Flow

![](../samples/confidence.png)

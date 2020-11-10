A node that saves messages sent to an actuator and resends on restart. 

### Details

This node can be placed between a node that is sending a message do another node, in order to store the last message that is sent. Every message is immediatelly redirected to the destination node as soon as it's received by the checkpoint node. When there's a restart, the checkpoint will resend the last message if it's within a specified time to live.

### Setup 

In order for the checkpoint node to work properly, local context storage must be set in your .node-red folder, by adding the following:

<dl>

<pre>  contextStorage: {
    default: "memoryOnly",
    memoryOnly: {
      module: 'memory'
    },
    file: {
      module: 'localfilesystem'
    },
  },
</pre>

</dl>

### Properties

<dl class="message-properties">

<dt>name<span class="property-type">string</span></dt>

<dd>name of node to be displayed in editor</dd>

<dt>ttl<span class="property-type">integer</span></dt>

<dd>last message's time to live, in seconds</dd>

</dl>

### Inputs

<dl class="message-properties">Any type of message</dl>

### Outputs

<dl class="message-properties">Equal to the last message sent as input</dl>
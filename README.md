# SHEN: Self-Healing Extensions for Node-RED 

![Logo](https://i.imgur.com/AynqSQm.png)

## node-red-contrib-self-healing
### **!Under Active Development!** 

A collection of nodes for making Node-RED more resilient by adding self-healing capabilities.

This work is part of an on-going PhD thesis in Software Engineering and Internet-of-Things at the Faculty of Engineering, University of Porto (FEUP). Work supervised by Prof. [Hugo Sereno Ferreia](http://hugosereno.eu/) and Prof. [João Pascoal Faria](https://sigarra.up.pt/feup/en/FUNC_GERAL.FORMVIEW?P_CODIGO=210006). With collaboration of Prof. [André Restivo](https://web.fe.up.pt/~arestivo/page/).

## Available Nodes

### :package: action-delay 

Delay a command (message) in order to meet the actuator response capacity (e.g. avoid overload).

### :package: compensate	

Compensate missing values (detected by disruptions on the periodicity of incoming mesages) with a pre-defined strategy (e.g. average of the last 10 readings, last value or maximum value of the last 10 readings).

### :package: compensate-confiability 

Similar to `compensate` but gives an additional output with a confiability metric (function can be defined, e.g. decay logarithmically for each followed value compensed).

### :package: distinct

Drop message if it is equal to the last one recieved (e.g. ignore repeated actions such as keep pushing the `on` button of a light system).

### :package: flow-control

Enable and disable Node-RED flows during runtime (local or remote instances, using the available REST API).

### :package: network-aware

Continuosly scan the network to find new or removed devices. Can be combined with a `device-registry`.

### :package: redundancy

Manage redundant instances of Node-RED (setting a master instance). Works only on the local network (uses [n2n](https://flows.nodered.org/node/node-red-contrib-n2n) communication).

### :package: replication-voter

Picks a value (e.g. sensor reading) from an array values based on a pre-defined majority.

### :package: threshold-check

Checks for reading (value) sanity (e.g. checks if the reading is between the sensor possible output values).

## Todo Nodes

### :package: device-registry

Store a list of the available devices in the network.

### :package: phase-shifter

Drop values if they are within a given threshold (e.g. two close temperature readings).

## Known Issues

- Lack of description on how to configure nodes.
- Lack of standardization on inputs and outputs.
- Some edge cases still break the *nodes* functionality.

## How to Use

- Clone or download this repository.
- In your node-red user directory, typically ~/.node-red (in Windows something like `C:\Users\<my_name>\.node_red`), run: `npm install node-red-contrib-self-healing` (`node-red-contrib-self-healing` correspond to the downloaded folder)
- Start (or restart) Node-RED.
- Nodes should be available under the SHEN tab of the *node palette*.

- [Official Documentation](https://nodered.org/docs/creating-nodes/first-node#testing-your-node-in-node-red)

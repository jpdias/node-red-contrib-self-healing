# SHEN: Self-Healing Extensions for Node-RED 

![Logo](https://i.imgur.com/AynqSQm.png)

## node-red-contrib-self-healing


[![DOI](https://zenodo.org/badge/doi/10.1007/978-3-030-50426-7_27.svg)](http://dx.doi.org/10.1007/978-3-030-50426-7_27)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![View this project on NPM](https://www.npmjs.com/package/node-red-contrib-self-healing)](https://img.shields.io/npm/v/badges.svg)
[![View this project on NPM](https://www.npmjs.com/package/node-red-contrib-self-healing)](https://img.shields.io/npm/dm/badges.svg)

### **! Under Active Development ! ** 

A collection of nodes for making Node-RED more resilient by adding self-healing capabilities. This project is at an early development stage.

This work is part of an ongoing PhD thesis in Software Engineering and Internet-of-Things at the Faculty of Engineering, University of Porto (FEUP). Work supervised by Prof. [Hugo Sereno Ferreia](http://hugosereno.eu/) and Prof. [João Pascoal Faria](https://sigarra.up.pt/feup/en/FUNC_GERAL.FORMVIEW?P_CODIGO=210006). With collaboration of Prof. [André Restivo](https://web.fe.up.pt/~arestivo/page/).

## Available Nodes

### :package: action-delay 

Delay a command (message) in order to meet the actuator response capacity (e.g. avoid overload). Similar to [rate-limit-messages](https://cookbook.nodered.org/basic/rate-limit-messages), but with different strategies.

### :package: compensate	

Compensate missing values (detected by disruptions on the periodicity of incoming mesages) with a pre-defined strategy (e.g. average of the last 10 readings, last value or maximum value of the last 10 readings).

### :package: compensate-confiability 

Similar to `compensate` but gives an additional output with a confiability metric (function can be defined, e.g. decay logarithmically for each followed value compensed).

### :package: kalman-noise-filter

Kalman noise filter based on the work of Bulten et al.

> R models the process noise and describes how noisy our system internally is. Or, in other words, how much noise can we expect from the system itself? Our system is constant we can set this to a (very) low value. Q resembles the measurement noise; how much noise is caused by our measurements? As we expect that our measurements will contain most of the noise, it makes sense to set this parameter to a high number (especially in comparison to the process noise).

> In real life scenario's you usually make an estimate of R and Q based on measurements or domain knowledge. For this example we assume we know the noise levels.

> W. Bulten, A. C. V. Rossum and W. F. G. Haselager, **Human SLAM, Indoor Localisation of Devices and Users,** 2016 IEEE First International Conference on Internet-of-Things Design and Implementation (IoTDI), Berlin, 2016, pp. 211-222, doi: 10.1109/IoTDI.2015.19.

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

### :package: heartbeat

Provides a heartbeat probe for MQTT and HTTP. For HTTP an endpoint must be provided, for MQTT an `MQTT in` node should be connected.

### :package: timing-check

Checks for timing issues on data inputs. There are 3 outputs that refer to data comming on expected time, too slow or too fast. A frequency in seconds along with a margin (float: 0-1) should be provided.

### :package: readings-watcher

Drop values if they are in or out of a given threshold (e.g. two close temperature readings).


## Todo Nodes

### :package: device-registry

Store a list of the available devices in the network.

## Known Issues

- Lack of description on how to configure nodes.
- No standardization on inputs and outputs.
- Lack of proper unit testing. Some edge cases still break the *node's* functionality.

## How to Use

- Installing Node-RED (Official Docs): [https://nodered.org/docs/getting-started/](https://nodered.org/docs/getting-started/)

### Installing node-red-contrib-self-healing (SHEN)

SHEN is not yet available in the Node-RED node registry (npm) due to its early development stage.

- Clone or download this repository.
- In your node-red user directory, typically ~/.node-red (in Windows something like `C:\Users\<my_name>\.node_red`), run: `npm install <path_to_downloaded_folder>/node-red-contrib-self-healing`
- Start (or restart) Node-RED.
- Nodes should be available under the SHEN tab of the *node palette*.

- [Installing Costum Nodes -- Official Documentation](https://nodered.org/docs/creating-nodes/first-node#testing-your-node-in-node-red)

### Citing this Work

If you find this code useful in your research, please consider citing:


    @inproceedings{DiasICCS2020,
        author="Dias, Jo{\~a}o Pedro and Lima, Bruno and Faria, Jo{\~a}o Pascoal and Restivo, Andr{\'e} and Ferreira, Hugo Sereno",
        editor="Krzhizhanovskaya, Valeria V. and Z{\'a}vodszky, G{\'a}bor and Lees, Michael H. and Dongarra, Jack J. and Sloot, Peter M. A. and Brissos, S{\'e}rgio and Teixeira, Jo{\~a}o",
        title="Visual Self-healing Modelling for Reliable Internet-of-Things Systems",
        booktitle="Computational Science -- ICCS 2020",
        year="2020",
        publisher="Springer International Publishing",
        address="Cham",
        pages="357--370",
        isbn="978-3-030-50426-7"
    }


# SHEN: Self-Healing Extensions for Node-RED

![Logo](https://i.imgur.com/AynqSQm.png)

## node-red-contrib-self-healing

[![DOI](https://zenodo.org/badge/doi/10.1007/978-3-030-50426-7_27.svg)](http://dx.doi.org/10.1007/978-3-030-50426-7_27)
[![DOI](https://zenodo.org/badge/doi/10.1145/3361149.3361165.svg)](http://dx.doi.org/10.1145/3361149.3361165)
[![npm version badge](https://img.shields.io/npm/v/node-red-contrib-self-healing.svg)](https://www.npmjs.org/package/node-red-contrib-self-healing)
[![downloads badge](https://img.shields.io/npm/dm/node-red-contrib-self-healing.svg)](https://www.npmjs.com/package/node-red-contrib-self-healing)
[![license: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A collection of nodes for making Node-RED more resilient by adding self-healing capabilities. This project is at an early development stage.

This work is part of an ongoing PhD thesis in Software Engineering and Internet-of-Things at the Faculty of Engineering, University of Porto (FEUP). Work supervised by Prof. [Hugo Sereno Ferreia](http://hugosereno.eu/) and Prof. [João Pascoal Faria](https://sigarra.up.pt/feup/en/FUNC_GERAL.FORMVIEW?P_CODIGO=210006). With collaboration of Prof. [André Restivo](https://web.fe.up.pt/~arestivo/page/). 

Each node has a README.md in its folder with further information.

## Available Nodes

### [action-audit](action-audit)

Checks if an action was completed by using sensor acknowledgements.

### [balancing](balancing)

Balances the distribution of messages through multiple outputs using three different strategies: Round Robin, Weighted Round Robin and Random.

### checkpoint

Acts between a node sending a message to another, storing the last one in local context and resending it after restarts, if it's within a specified time to live.

### compensate

Compensate missing values (detected by disruptions on the periodicity of incoming mesages) with a pre-defined strategy (e.g. average of the last 10 readings, last value or maximum value of the last 10 readings).

### debounce

Delay a command (message) in order to meet the actuator response capacity (e.g. avoid overload). Similar to [rate-limit-messages](https://cookbook.nodered.org/basic/rate-limit-messages), but with different strategies.

### flow-control

Enable and disable Node-RED flows during runtime (local or remote instances, using the available REST API).

### heartbeat

Provides a heartbeat probe for MQTT and HTTP.

### http-aware

A node to continuously scan the network to find working IPs at ports 8080, 443 and 80.

### kalman-noise-filter

Kalman noise filter.

### network-aware

Continuosly scan the network to find new or removed devices. Can be combined with a `device-registry`.

### redundancy

Manage redundant instances of Node-RED (setting a master instance). Works only on the local network (uses [n2n](https://flows.nodered.org/node/node-red-contrib-n2n) communication).

### readings-watcher

Drop values if they are in or out of a given threshold (e.g. two close temperature readings).

### replication-voter

Picks a value (e.g. sensor reading) from an array values based on a pre-defined majority.

### resource-monitor

Monitors system resources, ranging from battery levels to resources usage.

### threshold-check

Checks for reading (value) sanity (e.g. checks if the reading is between the sensor possible output values).

### timing-check

Checks for timing issues on data inputs. There are 3 outputs that refer to data comming on expected time, too slow or too fast. A frequency in seconds along with a margin (float: 0-1) should be provided.

### device-registry

All the devices that are reachable can communicate with this device in order to store their information and current state.

## To-do Nodes

### internal-state

Stores the internal state of all flows, making it available to different Node-RED instances.

## How to Use

- Installing Node-RED (Official Docs): [https://nodered.org/docs/getting-started/](https://nodered.org/docs/getting-started/)

### Installing node-red-contrib-self-healing for development

- Clone or download this repository.
- In your node-red user directory, typically ~/.node-red (in Windows something like `C:\Users\<my_name>\.node_red`), run: `npm install <path_to_downloaded_folder>/node-red-contrib-self-healing`
- Start (or restart) Node-RED.
- Nodes should be available under the SHEN tab of the _node palette_.

### Running tests

- First run: `npm install`

- Unit tests for every node: `npm run test`
- Unit tests with coverage: `npm run test-coverage`
- Mutation tests: `npm run mutate`
- Property based tests: `npm run test-pbt`
- Acceptance tests: `npm run test-acceptance`

### Helper documentation

- [Installing Costum Nodes -- Official Documentation](https://nodered.org/docs/creating-nodes/first-node#testing-your-node-in-node-red)

### Citing this Work

If you find this code useful in your research, please consider citing:

> Visual Self-healing Modelling for Reliable Internet-of-Things Systems (ICCS 2020)

    @inproceedings{DiasICCS2020,
        author="Dias, Joao Pedro and Lima, Bruno and Faria, Joao Pascoal and Restivo, Andre and Ferreira, Hugo Sereno",
        editor="Krzhizhanovskaya, Valeria V. and Zavodszky, Gabor and Lees, Michael H. and Dongarra, Jack J. and Sloot, Peter M. A. and Brissos, Sergio and Teixeira, Joao",
        title="Visual Self-healing Modelling for Reliable Internet-of-Things Systems",
        booktitle="Computational Science -- ICCS 2020",
        year="2020",
        publisher="Springer International Publishing",
        address="Cham",
        pages="357--370",
        isbn="978-3-030-50426-7"
    }

> A Pattern-Language for Self-Healing Internet-of-Things Systems (EuroPLoP'20)

    @inproceedings{DiasEuroplop2020,
        title        = {A Pattern-Language for Self-Healing Internet-of-Things Systems},
        author       = {Dias, Jo\~{a}o Pedro and Sousa, Tiago Boldt and Restivo, André and Ferreira, Hugo Sereno},
        year         = 2020,
        booktitle    = {Proceedings of the 25th European Conference on Pattern Languages of Programs},
        location     = {Irsee, Germany},
        publisher    = {Association for Computing Machinery},
        address      = {New York, NY, USA},
        series       = {EuroPLop ’20},
        doi          = {10.1145/3361149.3361165},
        numpages     = 8
    }

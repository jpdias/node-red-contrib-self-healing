'use strict';

const os = require('os');
const {exec} = require('child_process');


var flag,
    osType = os.type();

if (osType == 'Linux' || osType == 'Windows_NT') flag = '-w';
else if (osType == 'Darwin') flag = '-t';
else throw new Error('Unsupported OS: ' + osType);

/**
* Build array of full ip range (xxx.xxx.x.1-255) given example ip address
* @param {String} ip
*/
function getFullRange(ip) {
    ip = ip || arpping.myIP;
    var ipStart = ip.substr(0, ip.lastIndexOf('.') + 1);
    return arpping.includeEndpoints ? 
        Array.from({length: 255}, (el, i) => ipStart + (i + 1)):
        Array.from({length: 253}, (el, i) => ipStart + (i + 2));
}

/**
* Ping a range of ip addresses
* @param {Array} range
* @param {Function} callback
*/
function pingDevices(range, callback) {
    if (!(Array.isArray(range) && range.length)) {
        if (!arpping.myIP) return arpping.findMyInfo(() => pingDevices(range, callback));
        range = getFullRange();
    }
    
    var found = [],
        missing =[],
        checked = 0;
    
    var args = ['ping', flag, arpping.timeout];
    range.forEach((ip) => {
        args[3] = ip;
        exec(args.join(' '), (err, stdout, stderr) => {
            checked++;
            if (err || stdout.indexOf('100% packet loss') > -1) missing.push(ip);
            else found.push(ip);
            
            if (checked == range.length) callback(null, found, missing);
        });
    });
}

/**
* Arp a range of ip addresses
* @param {Array} range
* @param {Function} callback
*/
function arpDevices(range, callback) {
    if (!Array.isArray(range)) return callback(new Error('range must be an array of IP addresses'));
    if (!range.length) return callback(new Error('range must not be empty'));
    
    var hosts = [],
        missing = [],
        checked = 0;
    
    range.forEach(function(ip) {
        exec('arp ' + ip, (err, stdout, stderr) => {
            checked++;
            if (err || stdout.indexOf('no entry') > -1) missing.push(ip);
            else {
                var host = {};
                host.ip = ip;
                host.mac = (osType == 'Linux') ? stdout.split('\n')[1].replace(/ +/g, ' ').split(' ')[2]: stdout.split(' ')[3];
                if (ip == arpping.myIP) host.isYourDevice = true;
                hosts.push(host);
            }
            
            if (checked == range.length) callback(null, hosts, missing);
        });
    });
}

var retry = false;
var arpping = {
    findMyInfo: function(callback) {
        exec('ifconfig', (err, stdout, stderr) => {
            if (err) {
                console.log(err);
                return callback(err);
            }
            var ip = ""
            var mac = ""
            if (osType == 'Linux') {
                if (stdout.indexOf('enp0') == -1) return callback(new Error('No wifi connection'));
                var wlan0 = stdout.split('enp0')[1].split('\n');
                ip = wlan0[1].slice(wlan0[1].indexOf('inet ')).split(' ')[1];
                mac = wlan0[3].slice(wlan0[3].indexOf('ether ')).split(' ')[1];
            }
            else {
                var en0 = stdout.slice(stdout.indexOf('en0')).split('\n');
                if (en0[4].indexOf('status: inactive') > -1) return callback(new Error('No wifi connection'));
                ip = en0[3].split(' ')[1];
                mac = en0[1].split(' ')[1];
            }

            arpping.myIP = ip;
            callback(null, {ip: ip, mac: mac});
        });
    },
    discover: function(refIP, callback) {
        var range = null;
        if (refIP) {
            range = getFullRange(refIP);
        }
        else if (!arpping.myIP) {
            if (retry) {
                retry = false;
                return callback(new Error('Failed to find your IP address'));
            }
            arpping.findMyInfo((err, info) => {
                if (err) return callback(err);
                retry = true;
                arpping.discover(info.ip, callback);
            });
            return;
        }
        
        retry = false;
        pingDevices(range, (err, range) => {
            if (err) return callback(err);
            arpDevices(range, (error, hosts) => {
                if (error) return callback(error);
                callback(null, hosts);
            });
        });
    },
    search: {
        byIpAddress: function(ipArray, refIP, callback) {
            if (typeof ipArray == 'string') ipArray = [ipArray];
            else if (!Array.isArray(ipArray) || !ipArray.length) throw new Error(`Invalid ipArray: ${ipArray}. Search input should be one ip address string or an array of ip strings.`);
            
            arpping.discover(refIP || ipArray[0], (err, hosts) => {
                if (err) return callback(err);
                var check = JSON.stringify(hosts);
                callback(
                    null,
                    hosts.filter(h => ipArray.indexOf(h.ip) > -1),
                    ipArray.filter(ip => check.indexOf(ip) == -1)
                );
            });
        }
    },
    ping: pingDevices,
    arp: arpDevices,
    myIP: null,
    timeout: 10,
    includeEndpoints: false
}


/**
* Initialize arpping with a timeout for ping commands
* @param {Number} t
*/
module.exports = function(options) {
    if (options.timeout) {
        if (options.timeout < 1 || options.timeout > 60) throw new Error(`Invalid timeout: ${options.timeout}. Please choose a timeout between 1 and 60s`);
        else arpping.timeout = parseInt(options.timeout) || options.timeout.toFixed(0);
    }
    
    if (options.includeEndpoints) arpping.includeEndpoints = true;
    
    return arpping;
};
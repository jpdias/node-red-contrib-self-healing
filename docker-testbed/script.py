#! /usr/bin/python3

import paho.mqtt.client as mqttClient
import time

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to broker")
        global Connected                #Use global variable
        Connected = True                #Signal connection 
    else:
        print("Bad connection Returned code=",rc)
        print("Connection failed")
 
Connected = False   #global variable for the state of the connection
 
broker_address= "localhost"
port = 1883

client = mqttClient.Client("Python")               #create new instance
#client.username_pw_set("root")
client.on_connect= on_connect                      #attach function to callback
client.connect(broker_address, port=2222)          #connect to broker
 
client.loop_start()        #start the loop
 
while Connected != True:    #Wait for connection
    print("trying")
    time.sleep(0.1)
 
try:
    while True:
        print("sending")
        value = "\{temperature\:22\}"
        client.publish("sensor/temperature",value)
        raw_input()
except KeyboardInterrupt:
    client.disconnect()
    client.loop_stop()

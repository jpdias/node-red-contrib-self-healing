#! /usr/bin/python3

import paho.mqtt.client as mqttClient
import time
import random

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
port = 12345

client = mqttClient.Client("Python")               #create new instance
#client.username_pw_set("root")
client.on_connect= on_connect                      #attach function to callback
client.connect(broker_address, port=port)          #connect to broker
 
client.loop_start()        #start the loop
 
while Connected != True:    #Wait for connection
    print("trying")
    time.sleep(0.1)
 
try:
    while True:
        print("sending")
        tempval = random.uniform(18, 22) 
        value = '{"temperature":' + str(tempval) + '}'
        print(value)
        client.publish("sensor/temperature",value)
        time.sleep(5)
except KeyboardInterrupt:
    client.disconnect()
    client.loop_stop()
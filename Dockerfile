FROM nodered/node-red

WORKDIR /usr/src/node-red

COPY package.json selfhealing/package.json

#COPY nodes
COPY action-delay selfhealing/action-delay
COPY compensate selfhealing/compensate
COPY compensate-confiability selfhealing/compensate-confiability
COPY flow-control selfhealing/flow-control
COPY network-aware selfhealing/network-aware
COPY redundancy selfhealing/redundancy
COPY replication-voter selfhealing/replication-voter
COPY threshold-check selfhealing/threshold-check

RUN npm install selfhealing
RUN npm install node-red-contrib-n2n
RUN npm install node-red-node-serialport

COPY ./docker-testbed/data/node-red-data/settings.js /data/settings.js

VOLUME ["/data"]

# Start the container normally
ENTRYPOINT ["npm", "start", "--", "--userDir", "/data"]
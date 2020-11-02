FROM nodered/node-red

WORKDIR /usr/src/node-red

COPY --chown=node-red package.json selfhealing/package.json
COPY --chown=node-red package-lock.json selfhealing/package-lock.json

COPY --chown=node-red action-delay selfhealing/action-delay
COPY --chown=node-red compensate selfhealing/compensate
COPY --chown=node-red flow-control selfhealing/flow-control
COPY --chown=node-red network-aware selfhealing/network-aware
COPY --chown=node-red redundancy selfhealing/redundancy
COPY --chown=node-red replication-voter selfhealing/replication-voter
COPY --chown=node-red threshold-check selfhealing/threshold-check
COPY --chown=node-red kalman-noise-filter selfhealing/kalman-noise-filter
COPY --chown=node-red balancing selfhealing/balancing

USER node-red

RUN npm install selfhealing
RUN npm install node-red-contrib-n2n
RUN npm install node-red-node-serialport


VOLUME ["/data"]

# Start the container normally
ENTRYPOINT ["npm", "start", "--", "--userDir", "/data"]

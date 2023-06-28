#Build Image
docker build  -f Dockerfile.ubi -t tanlull/mq-node-demo .

#Run

docker run -dit   --name  node_client -v C:\git\ibm-mq-node-docker:/mnt  --network="host" tanlull/mq-node-demo

#Execute

docker exec -ti node_client  bash

#Copy Node module for redhat

cp -fr /opt/app-root/src/nodejs/mqput/node_modules /mnt

#Test

node amqsconn.js
const clone = require('clone');

let peers = [];

/*
cache: {
  'key': {
    'value': 'value',
    'date': 'date',
    'size': 'size',
  },
}
*/
const cache = {};
let cacheSize = 0;
// 4GB
const cacheLimit = 4 * 1024 * 1024 * 1024;

const evict = (key) => {
  console.log(`EVICTING ${key}`);
  if (cache[key]) {
    cacheSize -= cache[key].size;
    delete cache[key];
  }
};

const batchEvict = (keys) => {
  keys.forEach((key) => {
    evict(key);
  });
};

const evictOldest = () => {
  let oldestKey = null;
  let oldestDate = null;
  for (const key in cache) {
    if (cache[key].date < oldestDate) {
      oldestKey = key;
      oldestDate = cache[key].date;
    }
  }
  evict(oldestKey);
};

// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');

// Set the region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2',
});

const autoscaling = new AWS.AutoScaling();
const ec2 = new AWS.EC2();

const fetchWithTimeout = async (url, options, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
};

const updatePeers = async () => {
  try {
    if (process.env.AUTOSCALING_GROUP && process.env.AUTOSCALING_GROUP !== '') {
      // get all ip addresses of all nodes in auto scaling group
      const groups = await autoscaling
        .describeAutoScalingGroups({ AutoScalingGroupNames: [process.env.AUTOSCALING_GROUP] })
        .promise();

      const instances = groups.AutoScalingGroups[0].Instances;

      // get ip from ec2 instance id
      const ips = await Promise.all(
        instances.map((instance) =>
          ec2
            .describeInstances({
              InstanceIds: [instance.InstanceId],
            })
            .promise()
            .then((res) => res.Reservations[0].Instances[0].PublicIpAddress),
        ),
      );

      console.log('PEERS: [', `${ips.join(', ')}]`);

      // make a health check to each ip address
      const healthyIps = await Promise.all(
        ips.map((ip) =>
          fetchWithTimeout(`http://${ip}:80/cache/health`, {
            method: 'GET',
          })
            .then((res) => res.json())
            .then((json) => {
              if (json.status === 'ok') {
                return ip;
              }
              return null;
            })
            .catch((err) => console.log(err)),
        ),
      );

      console.log('HEALTHY PEERS: [', `${healthyIps.join(', ')}]`);
      peers = healthyIps.filter((ip) => ip !== undefined);
    }
  } catch (err) {
    console.log(err);
  }
};

const invalidate = async (key) => {
  console.log(`INVALIDATING ${key}`);
  try {
    if (process.env.AUTOSCALING_GROUP && process.env.AUTOSCALING_GROUP !== '') {
      // send invalidate request to each ip address
      await Promise.all(
        peers.map((ip) =>
          fetchWithTimeout(
            `http://${ip}:80/cache/invalidate`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                secret: process.env.CACHE_SECRET,
                key,
              }),
            },
            1000,
          ),
        ),
      );
    } else {
      evict(key);
    }
  } catch (err) {
    console.log(err);
  }
};

const batchInvalidate = async (keys) => {
  console.log(`BATCH INVALIDATING [${keys.join(', ')}]`);
  try {
    if (process.env.AUTOSCALING_GROUP && process.env.AUTOSCALING_GROUP !== '') {
      // send invalidate request to each ip address
      await Promise.all(
        peers.map((ip) =>
          fetchWithTimeout(
            `http://${ip}:80/cache/batchinvalidate`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                secret: process.env.CACHE_SECRET,
                keys,
              }),
            },
            1000,
          ),
        ),
      );
    } else {
      keys.forEach((key) => evict(key));
    }
  } catch (err) {
    console.log(err);
  }
};

const put = (key, value) => {
  console.log(`PUTTING ${key}`);

  if (process.env.CACHE_ENABLED !== 'true') {
    return;
  }

  const size = JSON.stringify(value).length;

  if (size > cacheLimit / 100) {
    return;
  }

  while (size + cacheSize > cacheLimit) {
    evictOldest();
  }

  cache[key] = {
    value: clone(value),
    date: new Date().valueOf(),
    size,
  };
  cacheSize += size;
};

const get = (key) => {
  if (process.env.CACHE_ENABLED !== 'true') {
    return null;
  }

  const item = cache[key];
  if (item) {
    console.log(`CACHE HIT ${key}`);
    return clone(item.value);
  }

  console.log(`CACHE MISS ${key}`);

  return null;
};

const batchGet = (keys) => {
  return keys.map((key) => get(key));
};

const batchPut = (dict) => {
  Object.entries(dict).forEach(([key, value]) => put(key, value));
};

// update peers now, and every minute
updatePeers();
setInterval(updatePeers, 1000 * 60);

module.exports = {
  put,
  get,
  evict,
  invalidate,
  updatePeers,
  batchGet,
  batchPut,
  batchInvalidate,
  batchEvict,
};
import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    let connected = false;

    this.client.on('error', (error) => {
      console.log(`Redis server not connected ${error}`);
    }).on('connect', () => {
      this.connected = true;
      console.log('Redis client connected to the server');
    });
  }

  isAlive() {
    return this.connected;
  }

  async get(key) {
    const asyncGet = promisify(this.client.get).bind(this.client);
    const redisValue = await asyncGet(key);
    return redisValue;
  }

  async set(key, redisValue, duration) {
    const asyncSet = promisify(this.client.set).bind(this.client);
    await asyncSet(key, redisValue);
    await this.client.expire(key, duration);
  }

  async del(key) {
    const asyncDel = promisify(this.client.del).bind(this.client);
    await asyncDel(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;

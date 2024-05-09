import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (error) => {
      console.log(`Redis server not connected ${error}`);
    });
  }

  isAlive() {
    if (this.client.connected) {
      return true;
    }
    return false;
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
    asyncDel = promisify(this.client.del).bind(this.client);
    await asyncDel(key);
  }
}
const redisClient = new RedisClient();
module.exports = redisClient;

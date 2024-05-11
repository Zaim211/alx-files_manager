import { expect, use } from 'chai';
import chaiHttp from 'chai-http';
import { promisify } from 'util';
import redisClient from '../utils/redis';

use(chaiHttp);

describe('Test redis Client', () => {
  before(async () => {
    await redisClient.client.flushall('ASYNC');
  });

  after(async () => {
    await redisClient.client.flushall('ASYNC');
  });

  it('Test connection is alive', async () => {
    expect(redisClient.isAlive()).to.equal(true);
  });

  it('check the key if null', async () => {
    expect(await redisClient.get('myKey')).to.equal(null);
  });

  it('Test set key', async () => {
    expect(await redisClient.set('myKey', 12, 1)).to.equal(undefined);
  });

  it('check the key after expiration', async () => {
    const sleep = promisify(setTimeout);
  await sleep(1000);
    expect(await redisClient.get('myKey')).to.equal(null);
  });
});

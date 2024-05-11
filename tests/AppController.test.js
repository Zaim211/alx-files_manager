import {
  expect, use, should, request,
} from 'chai';
import chaiHttp from 'chai-http';
import app from '../server';
import dbClient from '../utils/db';

use(chaiHttp);

describe('Test App Status Endpoints', () => {
  describe('GET /status', () => {
    it('Test status of redis and mongodb connection', async () => {
      const res = await request(app).get('/status').send();
      const body = JSON.parse(res.text);
      expect(body).to.equal({ redis: true, db: true });
      expect(res.statusCode).to.equal(200);
    });
  });

  describe('GET /stats', () => {
    before(async () => {
      await dbClient.usersCollection.deleteMany({});
      await dbClient.filesCollection.deleteMany({});
    });

    it('Test the number of users and files in db ', async () => {
      const res = await request(app).get('/stats').send();
      const body = JSON.parse(res.text);
      expect(body).to.equal({ users: 0, files: 0 });
      expect(res.statusCode).to.equal(200);
    });

    it('Check the number of users and files in db with result', async () => {
      await dbClient.usersCollection.insertOne({ name: 'youssef' });
      await dbClient.filesCollection.insertOne({ name: 'image.png' });
      await dbClient.filesCollection.insertOne({ name: 'file.txt' });

      const res = await request(app).get('/stats').send();
      const body = JSON.parse(res.text);
      expect(body).to.equal({ users: 1, files: 2 });
      expect(res.statusCode).to.equal(200);
    });
  });
});

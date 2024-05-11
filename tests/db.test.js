import { expect, use } from 'chai';
import chaiHttp from 'chai-http';
import dbClient from '../utils/db';

use(chaiHttp);


describe('dbClient', () => {
    before(async () => {
      await dbClient.client.connect();

      dbClient.usersCollection = dbClient.db.collection('users');
      dbClient.filesCollection = dbClient.db.collection('files');

      await dbClient.usersCollection.deleteMany({});
      await dbClient.filesCollection.deleteMany({});
    });
    after(async () => {
      await dbClient.usersCollection.deleteMany({});
      await dbClient.filesCollection.deleteMany({});
    });

    it('Test dbClient is alive', () => {
      expect(dbClient.isAlive()).to.equal(true);
    });

    it('Check the number of user documents', async () => {
      await dbClient.usersCollection.deleteMany({});
      expect(await dbClient.nbUsers()).to.equal(0);

      await dbClient.usersCollection.insertOne({ name: 'youssef' });
      await dbClient.usersCollection.insertOne({ name: 'zaim' });
      expect(await dbClient.nbUsers()).to.equal(2);
    });

    it('cCheck the number of file documents', async () => {
      await dbClient.filesCollection.deleteMany({});
      expect(await dbClient.nbFiles()).to.equal(0);

      await dbClient.filesCollection.insertOne({ name: 'File1' });
      await dbClient.filesCollection.insertOne({ name: 'File2' });
      expect(await dbClient.nbUsers()).to.equal(2);
    });
});

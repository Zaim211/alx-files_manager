import { MongoClient } from 'mongodb';
const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || 27017;
const DATABASE = process.env.DB_DATABASE || 'file_manager';
const url = `mongodb://${HOST}:${PORT}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(url, { useUnifiedTopology: true, useNewUrlParser: true });
    this.client.connect().then(() => {
      this.db = this.client.db(`${DATABASE}`);
    }).catch((error) => {
      console.log(error);
    });
  }

  isAlive() {
    return Boolean(this.db);
  }

  async nbUsers() {
    const users = this.db.collection('users')
    const numberOfUsers = await users.countDocuments();
    return numberOfUsers;
  }

  async nbFiles() {
    const files = this.db.collection('files');
    const numberOfFiles = await files.countDocuments();
    return numberOfFiles;
  }
}

const dbClient = new DBClient();

module.exports = dbClient;

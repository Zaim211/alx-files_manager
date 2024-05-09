import { MongoClient } from 'mongodb';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'file_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(url, { useUnifiedTopology: true, useNewUrlParser: true });
    this.client.connect().then(() => {
      this.db = this.connect.db(`${DB_DATABASE}`);
    }).catch((error) => {
      console.log(error);
    });
  }

  isAlive() {
    return Boolean(this.db);
  }

  async nbUsers() {
    const users = this.db.collection('users')
    const numberOfUsers = await users.countDocument();
    return numberOfUsers;
  }

  async nbFiles() {
    const files = this.db.collection('files');
    const numberOfFiles = await files.countDocument();
    return numerOfFiles;
  }
}

const dbClient = new DBClient();

module.exports = dbClient;

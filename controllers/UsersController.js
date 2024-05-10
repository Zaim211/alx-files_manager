import sha1 from 'sha1';
import dbClient from '../utils/db';
import Queue from 'bull';
import { ObjectID } from 'mongodb';
import redisClient from '../utils/redis';

const queue = new Queue('queue', 'redis://127.0.0.1:6379');

class UsersController {
  static postNew(req, res) {
    const {email} = req.body;
    const {password} = req.body;

    if (!email) {
      res.stutus(400).json({ error: 'Missing email'});
    }
    if (!password) {
      res.status(400).json({error: 'Missing password'});
    }
    const users = dbClient.db.collection('users');
    users.findOne({ email }, (err, user) => {
      if (user) {
        res.status(400).json({ error: 'Already exist' });
      } else {
        const hashPass = sha1(password);
        users.insertOne(
          {
            email,
            password: hashPass,
          },
        ).then((result) => {
          res.status(201).json({ id: result.insertedId, email });
          queue.add({ userId: result.insertedId });
        }).catch((error) => console.log(error));
      }
    });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (userId) {
      const users = dbClient.db.collection('users');
      const idObj = new ObjectID(userId);
      users.findOne({
        _id: idObj
      }, (error, user) => {
        if (user) {
	  res.status(200).json({ id: userId, email: user.email });
        } else {
          res.status(401).json({ error: 'Unauthorized' });
        }
      });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
	
  }
}

module.exports = UsersController;

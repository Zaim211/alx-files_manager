import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const auth = req.header('Authorization');
    let Email = auth.split(' ')[1];
    const BasicAuth = Buffer.from(Email, 'base64');
    Email = BasicAuth.toString('ascii');
    const dataUser = Email.split(':');
    if (dataUser.length !== 2) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    const hashPass = sha1(dataUser[1]);
    const users = dbClient.db.collection('users');
    users.findOne({
      email: dataUser[0],
      password: hashPass
    }, async (error, user) => {
      if (user) {
        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
        res.status(200).json({ token });
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const id = redisClient.get(key);
    if (id) {
      await redisClient.del(key);
      res.status(204).json({});
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = AuthController;

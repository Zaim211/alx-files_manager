import sha1 from 'sha1';
import dbClient from '../utils/db';

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
        const hashedPassword = sha1(password);
        users.insertOne(
          {
            email,
            password: hashedPassword,
          },
        ).then((result) => {
          res.status(201).json({ id: result.insertedId, email });
          userQueue.add({ userId: result.insertedId });
        }).catch((error) => console.log(error));
      }
    });
  }
}

module.exports = UsersController;

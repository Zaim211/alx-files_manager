import { ObjectID } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import Queue from 'bull';
import { promises as fs } from 'fs';

const queueFile = new Queue('queueFile', 'redis://127.0.0.1:6379');

class FilesController {
  static async getUsers(req, res) {
    const token = req.header('X-token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (userId) {
      const users = dbClient.db.collection('users');
      const idObj = new ObjectID(userId);
      const user = await users.findOne({ _id: idObj });
      if (!user) return null;
      return user;
    }
    return null;
  }

  static async postUpload(req, res) {
    const user = await FilesController.getUsers(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    const { name } = req.body;
    const { type } = req.body;
    const { parentId } = req.body;
    const isPublic = Boolean(req.body);
    const { data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type != 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    const files = dbClient.db.collection('files');
    if (parentId) {
      const idObj = new ObjectID(parentId);
      const file = await files.findOne({ id: idObj, userId: user._id });
      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (file.type !== 'folder') {
	return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    if (type === 'folder') {
      files.insertOne({
        userId: user._id,
        name,
        type,
        parentId: parentId || 0,
        isPublic,
      }).then((result) => res.status(201).json({
        id: result.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      })).catch((error) => {
        console.log(error);
      });
    } else {
      const pathFile = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileName = `${pathFile}/${uuidv4()}`;
      const basic_auth = Buffer.from(data, 'base64');
      try {
	try {
          await fs.mkdir(pathFile);
        } catch (error) {
          console.log('error');
        }
        await fs.writeFile(fileName, basic_auth, 'utf-8');
      } catch (error) {
        console.log(error);
      }
      files.insertOne(
        {
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
          localPath: fileName,
        },
      ).then((result) => {
        res.status(201).json(
          {
            id: result.insertedId,
            userId: user._id,
            name,
            type,
            isPublic,
            parentId: parentId || 0,
          },
        );
        if (type === 'image') {
          queueFile.add(
            {
              userId: user._id,
              fileId: result.insertedId,
            },
          );
        }
      }).catch((error) => console.log(error));
    }
    return null;
  }

  static async getShow(req, res) {
    const user = await FilesController.getUsers(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const files = dbClient.db.collection('files');
    const fileId = req.params.id;
    const idObj = new ObjectID(fileId);
    const file = await files.findOne({ _id: idObj, userId: user._id });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    } else {
      return res.status(200).json(file);
    }
  }

  static async getIndex(req, res) {
    const user = await FilesController.getUsers(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    let query;
    const { parentId, page } = req.query;
    const pages = page || 0;
    const files = dbClient.db.collection('files');
    if (!parentId) {
      query = { userId: user._id };
    } else {
      query = { userId: user._id, parentId: ObjectID(parentId) };
    }
    files.aggregate(
      [
        { $match: query },
        { $sort: { _id: -1 } },
        {
          $facet: {
            metadata: [{ $count: 'total' }, { $addFields: { page: parseInt(pages, 10) } }],
            data: [{ $skip: 20 * parseInt(pages, 10) }, { $limit: 20 }],
          },
        },
      ],
    ).toArray((error, result) => {
      if (result) {
        const final = result[0].data.map((file) => {
          const tmpFile = {
            ...file,
            id: file._id,
          };
          delete tmpFile._id;
          delete tmpFile.localPath;
          return tmpFile;
        });
        return res.status(200).json(final);
      }
      return res.status(404).json({ error: 'Not found' });
    });
    return null;
  }
}

module.exports = FilesController;

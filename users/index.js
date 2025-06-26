const express = require('express');
const body_parser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(body_parser.json());

app.post('/adduser', async (req, res) => {
    const { username, password, privileges } = req.body;

    const uri = 'mongodb://localhost:27020';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('AuctionPlatform');
        const usersCollection = db.collection('users');

        const create_user = await usersCollection.insertOne({
            username: username,
            password: password,
            privileges: privileges
        });

        return res.status(201).json(create_user);
    } catch (error) {
        console.error('Database connection error:', error);
        return res.status(500).json({ error: 'Database connection failed' });
    } finally {
        await client.close();
    }
})

app.post('/getuser', async (req, res) => {
    const { username } = req.body;

    const uri = 'mongodb://localhost:27020';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('AuctionPlatform');
        const collection = db.collection('users');

        const get_user = await collection.findOne({ username: username });
        return res.status(200).json(get_user);
    } catch (error) {
        console.error('Database connection error:', error);
        return res.status(500).json({ error: 'Database connection failed' });
    } finally {
        await client.close();
    }
})


const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
});



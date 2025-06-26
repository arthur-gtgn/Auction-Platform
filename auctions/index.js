const express = require('express');
const cors = require('cors');
const body_parser = require('body-parser');
const { MongoClient } = require('mongodb')

const app = express();
app.use(cors());
app.use(body_parser.json());

app.post('/auction', async (req, res) => {

    const {
        title,
        description,
        starting_price,
        end_price,
        status,
        ends_at,
        owner
    } = req.body;

    const uri = 'mongodb://localhost:27020';
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const db = client.db('AuctionPlatform');
        const collection = db.collection('auctions');

        const create_auction = await collection.insertOne({
            title: title,
            description: description,
            starting_price: Number(starting_price),
            end_price: end_price ? Number(end_price) : null,
            status: status,
            ends_at: new Date(ends_at),
            owner: owner,
            created_at: new Date()
        });

        return res.status(201).json(create_auction);
    } catch (error) {
        console.error('Internal Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
    }
});

app.get('/auction', async (req, res) => {
    const uri = 'mongodb://localhost:27020';
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const db = client.db('AuctionPlatform');
        const collection = db.collection('auctions');

        const auctions = await collection.find({}).toArray();

        return res.status(200).json(auctions);
    } catch (error) {
        console.error('Internal Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
    }
});

app.get('/auction/:id', async (req, res) => {
    const { id } = req.params;
    const uri = 'mongodb://localhost:27020';
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const db = client.db('AuctionPlatform');
        const collection = db.collection('auctions');

        const { ObjectId } = require('mongodb');
        const auction = await collection.findOne({ _id: new ObjectId(id) });

        if (!auction) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        return res.status(200).json(auction);
    } catch (error) {
        console.error('Internal Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
    }
});

app.post('/auction/:id', async (req, res) => {
    const { id } = req.params;
    const {
        title,
        description,
        starting_price,
        end_price,
        status,
        ends_at
    } = req.body;

    const uri = 'mongodb://localhost:27020';
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const db = client.db('AuctionPlatform');
        const collection = db.collection('auctions');

        const { ObjectId } = require('mongodb');

        // Only update the fields provided, preserve the owner
        const updateFields = {
            title: title,
            description: description,
            starting_price: Number(starting_price),
            end_price: end_price ? Number(end_price) : null,
            status: status,
            ends_at: new Date(ends_at),
            updated_at: new Date()
        };

        const updateResult = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        return res.status(200).json({ success: true, message: 'Auction updated successfully' });
    } catch (error) {
        console.error('Internal Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
    }
})

const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
});

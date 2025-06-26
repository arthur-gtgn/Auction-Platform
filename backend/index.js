const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET || 'temporary_secret';

function requirePrivilege(privilege) {
    return (req, res, next) => {

        const auth = req.headers.authorization || '';
        const parts = auth.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).send('Unauthorized');
        }

        const token = parts[1];

        let payload;

        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).send('Unauthorized');
        }

        if (!Array.isArray(payload.privileges) || !payload.privileges.includes(privilege)) {
            return res.status(403).send('Forbidden');
        }

        req.user = payload;
        next();
    };
}

app.post('/auction', requirePrivilege('create-auction'), async (req, res) => {

    const {
        title,
        description,
        starting_price,
        end_price,
        status,
        ends_at
    } = req.body;

    // Get the owner from the JWT token instead of request body
    const owner = req.user.userId;

    try {
        const response = await fetch('http://localhost:4002/auction', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                starting_price,
                end_price,
                status,
                ends_at,
                owner
            })
        });
        const result = await response.json();

        return res.status(201).json({ success: true, message: 'Auction successfully created!', data: result});
    } catch (error) {
        console.error('Create auction error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/auctions', requirePrivilege('read'), async (req, res) => {
    try {
        const response = await fetch('http://localhost:4002/auction', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const auctions = await response.json();

        return res.status(200).json(auctions);
    } catch (error) {
        console.error('Fetch auctions error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/auction/:id', requirePrivilege('read'), async (req, res) => {
    const { id } = req.params;

    try {
        const response = await fetch(`http://localhost:4002/auction/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
        }

        const auction = await response.json();
        return res.status(200).json(auction);
    } catch (error) {
        console.error('Fetch auction error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/auction/:id', requirePrivilege('create-auction'), async (req, res) => {
    const { id } = req.params;
    const {
        title,
        description,
        starting_price,
        end_price,
        status,
        ends_at
    } = req.body;

    // Keep the same owner, don't allow changing it via edit
    // The owner is preserved from the original auction

    try {
        const response = await fetch(`http://localhost:4002/auction/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                starting_price,
                end_price,
                status,
                ends_at
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
        }

        const result = await response.json();
        return res.status(200).json(result);
    } catch (error) {
        console.error('Update auction error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
})

const PORT = process.env.PORT || 4005;

app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
});

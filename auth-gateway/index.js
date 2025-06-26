const express = require('express');
const jwt = require('jsonwebtoken');
const body_parser = require('body-parser');
const cors = require('cors')
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(body_parser.json());

const JWT_SECRET = process.env.JWT_SECRET || 'temporary_secret';

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const response = await fetch('http://localhost:4001/getuser', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });
        const user = await response.json();

        if (!user || user.password != password) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        const payload = {
            userId: user._id,
            privileges: user.privileges
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        return res.status(201).json({ token });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/register', async (req, res) => {
    const { username, password, privileges } = req.body;

    try {
        // Vérifier si l'utilisateur existe déjà
        const verification_response = await fetch('http://localhost:4001/getuser', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });
        const existing_user = await verification_response.json();

        if (existing_user) {
            res.status(409).json({ message: 'User already exists! Please chose another username.' })
        }

        const creation_response = await fetch('http:/localhost:4001/adduser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, privileges})
        });
        const created_user = await creation_response.json();

        return res.status(201).json({
            success: true,
            message: 'User successfully created!'
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
})

const PORT = process.env.PORT || 4003;

app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
});



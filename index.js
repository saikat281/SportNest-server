const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const dotenv = require('dotenv');
const cors = require('cors')
const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dotenv.config()
const uri = process.env.MONGODB_URI
const app = express()
app.use(cors())
app.use(express.json())
const PORT = process.env.PORT


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const JWKS = createRemoteJWKSet(
    new URL('http://localhost:3000/api/auth/jwks')
)
const verifyToken = async (req, res, next) => {
    const header = req.headers.authorization
    if (!header) {
        return res?.status(401).json({ message: "unauthorized" })
    }
    const token = header.split(" ")[1]
    if (!token) {
        return res?.status(403).json({ message: "unauthorized" })
    }
    try {
        const { payload } = await jwtVerify(token, JWKS)

        next()
    } catch (error) {
        res.status(401).json({
            message: "forbidden"
        })
    }

}

async function run() {
    try {

        const db = client.db("sportnest")  //create database
        const facilityCollection = db.collection('facilities') //create facility collection
        const bookingCollection = db.collection('bookings') // create booking collection


        app.get('/facility', async (req, res) => {

            const search = req.query.search || "";
            const sportType = req.query.sportType || "";

            let query = {};

            // console.log("RAW SEARCH:", search);
            // console.log("RAW SPORT:", sportType);
            // console.log("req.query: ",req.query)

            // Search by Facility Name
            if (search) {
                query.FacilityName = {
                    $regex: search,
                    $options: "i" // case insensitive
                };
            }

            // Filter by sport type
            if (sportType) {

                // multiple type support
                const sportTypesArray = sportType.split(",");

                query.FacilityType = {
                    $in: sportTypesArray
                };
            }
            //   console.log("FINAL QUERY:", query);

            //   console.log("SAMPLE DATA:", await facilityCollection.findOne());

            const result = await facilityCollection.find(query).toArray(); //db theke all data niye ashbo
            res.json(result);
        })

        app.post('/facility', verifyToken, async (req, res) => {
            const facilityData = req.body; //form data niye aschi

            const result = await facilityCollection.insertOne(facilityData); // insert data
            res.json(result);
        })

        // for facility-details
        app.get('/facility/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const result = await facilityCollection.findOne({ _id: new ObjectId(id) })
            res.json(result)
        }
        )


        app.patch('/facility/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const updateData = req.body
            const result = await facilityCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            )
            res.json(result)
        }
        )

        app.delete('/facility/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const result = await facilityCollection.deleteOne({ _id: new ObjectId(id) });

            res.json(result);
        })



        // for manage-my-facilities
        app.get('/facility/user/:userId', async (req, res) => {
            const { userId } = req.params;

            const search = req.query.search || "";
            const sportType = req.query.sportType || "";

            let query = {
                id: userId
            };

            

            // Search by Facility Name
            if (search) {
                query.FacilityName = {
                    $regex: search,
                    $options: "i" // case insensitive
                };
            }

            // Filter by sport type
            if (sportType) {

                // multiple type support
                const sportTypesArray = sportType.split(",");

                query.FacilityType = {
                    $in: sportTypesArray
                };
            }

            const result = await facilityCollection.find(query).toArray();
            res.json(result)

        })


        app.get('/booking/:userId', verifyToken, async (req, res) => {
            const { userId } = req.params;
            const result = await bookingCollection.find({ userId: userId }).toArray(); //database er userId : ekhaner destructure kora userId

            res.json(result)

        })

        app.post('/booking', verifyToken, async (req, res) => {
            const bookingData = req.body;

            const result = await bookingCollection.insertOne(bookingData); // insert data
            res.json(result);
        })


        app.delete('/booking/:bookingId', async (req, res) => {
            const { bookingId } = req.params;
            const result = await bookingCollection.deleteOne({ _id: new ObjectId(bookingId) });

            res.json(result);
        })



        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('server is running fine')
})

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})

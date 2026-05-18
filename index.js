const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const dotenv = require('dotenv');
const cors = require('cors')
const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

async function run() {
    try {
       
        const db = client.db("sportnest")  //create database
        const facilityCollection = db.collection('facilities') //create collection

        app.get('/facility', async(req,res)=>{
            const result = await facilityCollection.find().toArray(); //db theke all data niye ashbo
            res.json(result);
        })

        app.post('/facility', async(req,res)=>{
            const facilityData = req.body; //form data niye aschi

            const result = await facilityCollection.insertOne(facilityData); // insert data
            res.json(result);
        })

        app.get('/facility/:id',async(req,res)=>{
            const {id} = req.params;
            const result = await facilityCollection.findOne({_id: new ObjectId(id)})

            res.json(result)
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

require('dotenv').config()
const express = require('express')
const app = express()
const port = 4545
const cors = require('cors')

// middleware
app.use(express.json())
app.use(cors())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fx40ttv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();
        const database = client.db("abdullah107189");
        const projectsCollection = database.collection("projects");

        app.get('/', (req, res) => {
            res.send('Hello World!')
        })


        app.get('/projects', async (req, res) => {
            const limit = req.query.limit;
            let limitGetData;
            if (limit === "true") {
                limitGetData = await projectsCollection.find().limit(parseInt(4)).sort({ _id: -1 }).toArray()
            }
            else {
                limitGetData = await projectsCollection.find().sort({ _id: -1 }).toArray()
            }
            res.send(limitGetData)
        })
        app.get('/projects/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await projectsCollection.findOne(query)
            res.send(result)
        })
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

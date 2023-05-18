const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//midleware:
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zrkl84y.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

//jwt verify:
const varifyJwt =(req, res, next) =>{
    const authorization = req.headers.authorization
    // console.log(authorization);
    if(!authorization){
       return res.status(401).send({error: true, message: 'unauthorized token'})
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
        
        if(error){
            return res.status(401).send({error:true, message: 'unauthorized access'})
        }

        req.decoded = decoded;
        next()
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const serviceCollection = client.db('carDoctor').collection('services')
        const bookingCollection = client.db('carDoctor').collection('bookings')
        
        // jwt:
        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '1h' })
            res.send({token})
        })

        //service routs
        app.get('/services', async(req, res) => {
            const cursor = serviceCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/services/:id', async(req, res) => {
            const id = req.params.id;
            
            const query = {_id: new ObjectId(id)}
            const options = {
                projection: {  title: 1, service_id: 1, img: 1, price:1 },
              };
            const result = await serviceCollection.findOne(query, options );
            res.send(result)
        })

        
        //bookings:
        app.post('/bookings', async (req, res) => {
            const order = req.body;
            // console.log(order);
            const result = await bookingCollection.insertOne(order);
            res.send(result)
        })

        app.get('/bookings', varifyJwt, async(req, res) => {
            const decoded = req.decoded;
            
            if(decoded.email !== req.query.email){
                return res.status(403).send({error: true, message: 'forbidden access'})
            }
            let query = {}
            if(req?.query?.email){
                query = {email: req.query.email}
            }
            const result = await bookingCollection.find(query).toArray()
            res.send(result)

        })

        app.delete('/bookings/:id', async(req, res) => {
            const id = req.params.id
            const query ={_id: new ObjectId(id)}
            const result = await bookingCollection.deleteOne(query)
            res.json(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('car dorcor server is open')
})

app.listen(port, () => {
    console.log(`car server in runnig on port: ${port}`);
})
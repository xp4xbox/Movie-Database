const movieTools = require('./server_src/movieTools');

const mc = require('mongodb').MongoClient;

let movies = require('./data/movie-data-2500.json');
movies = movieTools.parseMovies(movies);

let people = movieTools.getUniquePeople(movies);
let genres = movieTools.getGenres(movies);

mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true}, function (err, client) {
    if (err) throw err;

    const dbo = client.db("moviedb");

    dbo.dropDatabase().then(() => {
        addData(dbo, client).then(() => {
            console.log("Finished");
            process.exit(0);
        });
    });
});

async function createCollection(dbo, name) {
    await dbo.createCollection(name);
}

async function insert(dbo, collection, item) {
    await dbo.collection(collection).insertMany(item);
}

async function insertOne(dbo, collection, item) {
    await dbo.collection(collection).insertOne(item);
}

async function addData(dbo, client) {
    await createCollection(dbo, "movies");
    await createCollection(dbo, "people");
    await createCollection(dbo, "genres");
    await createCollection(dbo, "users");

    await insert(dbo, "movies", movies);
    await insert(dbo, "people", people);
    await insertOne(dbo, "genres", {genres});

    await client.close();
}
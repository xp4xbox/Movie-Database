const dbTools = {}

dbTools.getMovies = async (mc) => {
    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    let value = await dbo.collection("movies").find().toArray();

    client.close();

    return value;
}

dbTools.getMovie = async (mc, title) => {
    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    title = title.toLowerCase();
    title = dbTools.formatTitle(title);

    let value = await dbo.collection("movies").findOne({Title: title});

    client.close();

    return value;
}

dbTools.getPerson = async (mc, person) => {
    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    let value = await dbo.collection("people").findOne({name: person});

    client.close();

    return value;
}

dbTools.updatePerson = async (mc, person) => {
    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    await dbo.collection("people").deleteOne({name: person.name});
    await dbo.collection("people").insertOne(person);

    client.close();
}

dbTools.getPeople = async (mc) => {
    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    let value = await dbo.collection("people").find().toArray();

    client.close();

    return value;
}

dbTools.addPerson = async (mc, person) => {
    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    await dbo.collection("people").insertOne(person);

    client.close();
}

dbTools.updateMovie = async (mc, movie) => {
    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    await dbo.collection("movies").deleteOne({Title: movie.Title});
    await dbo.collection("movies").insertOne(movie);

    client.close();
}

dbTools.addMovie = async (mc, movie) => {
    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    await dbo.collection("movies").insertOne(movie);

    client.close();
}

dbTools.addUser = async (mc, user) => {
    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    await dbo.collection("users").insertOne(user);

    client.close();
}

dbTools.getUser = async (mc, username) => {
    if (!username) {
        return null;
    }

    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    let value = await dbo.collection("users").findOne({username: username});

    client.close();

    return value;
}

dbTools.updateUser = async (mc, user) => {
    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    await dbo.collection("users").deleteOne({username: user.username});
    await dbo.collection("users").insertOne(user);

    client.close();
}

dbTools.getUsers = async (mc) => {
    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    let value = await dbo.collection("users").find().toArray();

    client.close();

    return value;
}

dbTools.getGenres = async (mc) => {
    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    let value = await dbo.collection("genres").findOne();

    // get second element in entries which will be genres
    // this allows for varying names for "genre"
    let i = 0;
    for (const [k, v] of Object.entries(value)) {
        if (i === 1) {
            value = value[k];
            break;
        }
        i++;
    }

    if (value) {
        return value;
    } else if (!value) {
        return [];
    }

    client.close();

    return value;
}

dbTools.setGenres = async (mc, genres) => {
    let client = await mc.connect("mongodb://localhost:27017/moviedb", {useUnifiedTopology: true});

    const dbo = client.db("moviedb");

    await dbo.collection("genres").deleteOne({});
    await dbo.collection("genres").insertOne({genres});

    client.close();
}

// same code in helper.js but to avoid circular dependency
dbTools.formatTitle = (str) => {
    let arrStr = str.split(" ");

    return arrStr.map(item => {
        return item.charAt(0).toUpperCase() + item.substr(1, item.length);
    }).join().replace(new RegExp(",", "g"), " ");
}

module.exports = dbTools;
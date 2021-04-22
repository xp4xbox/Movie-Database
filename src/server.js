const helper = require('./server_src/helper');
const movieTools = require('./server_src/movieTools');
const dbTools = require('./server_src/dbTools');

const https = require('https');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const mc = require('mongodb').MongoClient;

const app = express();
const port = 3000;

const USE_HTTPS = false;

const REC_MOVIE_LIST = 12;
const SIMILAR_MOVIE_LIST_SIZE = 8;
const FREQ_CONTRIBUTORS_LIST = 5;
const USERS_TO_SHOW = 100;

const INVALID_USER_CHARS = "/^[!@#$%^&*()_+-=[]{};':\"\\|,.<>\/?]*$/".split("");

// do not modify, should always be init as false
let newMovieAdded = false;

app.set("view engine", "pug");
app.use(express.static('public'));

app.use(session({
    secret: helper.generateRandomStr(12),
    saveUninitialized: true,
    resave: true,
    cookie: {maxAge: 1500000}
}));

if (USE_HTTPS) {
    let options = {key: fs.readFileSync('key.pem'), cert: fs.readFileSync('cert.pem')};
    https.createServer(options, app).listen(port, () => {
        console.log("Server listening at https://localhost:3000, using HTTPS");
    });
} else {
    app.listen(port, () => {
        console.log("Server listening at http://localhost:3000");
    });
}

app.get("/", (req, res) => {
    res.render("home");
});

app.route("/signin")
    .get((req, res) => {
        res.render("sign", {loggedIn: req.session.loggedIn});
    })

    .post((req, res) => {
        let data = "";
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            data = JSON.parse(data);
            login(req, res, data.username, data.password, false);
        });
    })

    .put((req, res) => {
        let data = "";
        req.on('data', (chunk) => {
            data += chunk;
        });

        req.on('end', () => {
            if (data === "") {
                logOut(req, res);
            } else {
                data = JSON.parse(data);
                createAccount(req, res, data);
            }
        });
    });

app.get("/search", (req, res) => {
    res.render("search");
});

app.post("/review", (req, res) => {
    let username = req.session.username;

    let review = "";
    req.on('data', (chunk) => {
        review += chunk;
    });

    req.on('end', () => {
        review = JSON.parse(review);

        putReview(req, res, username, review);
    });
});

app.route("/ownProfile*")
    .get((req, res) => {
        getOwnProfile(req, res);
    })

    .put((req, res) => {
        putOwnProfile(req, res);
    });


app.get("/searchResults", (req, res) => {
    searchResults(req, res);
});

app.get("/contribute", (req, res) => {
    contribute(req, res);
});

app.route("/peopleProfile")
    .get((req, res) => {
        getPeopleProfile(req, res);
    })
    .post((req, res) => {
        postPeopleProfile(req, res);
    });


app.get("/peopleProfile/*", (req, res) => {
    getPeopleProfileMore(req, res);
});

app.get("/userProfile/*", (req, res) => {
    getUserProfileMore(req, res);
});

app.get("/genre", (req, res) => {
    getGenre(req, res);
});

app.get("/users", (req, res) => {
    getUsers(req, res);
});

app.get("/genre/*", (req, res) => {
    let genre = decodeURIComponent(req.url.split("/")[2]).toString();
    res.render("genre", {genre: genre});
});

app.all("/movies/*", (req, res) => {
    allMoviesMore(req, res);
});

app.post("/movie", (req, res) => {
    postMovie(req, res);
});

async function putOwnProfile(req, res) {
    let url = req.url.split("/");

    if (url.length === 4 && req.query) {
        let user = await dbTools.getUser(mc, req.session.username);

        if (!user) {
            res.status(404).send("User doesn't exist or is not logged in.");
            return;
        }

        if (req.query.hasOwnProperty("isContributing")) {
            user["isContributing"] = (req.query.isContributing === 'true');

        } else if (req.query.hasOwnProperty("toggleFollowPerson")) {
            let person = req.query.toggleFollowPerson;

            if (!(person = await dbTools.getPerson(mc, person))) {
                res.status(404).send("Could not find person");
                return;
            }

            await helper.togglePeopleFollow(mc, user, person);
            await dbTools.updatePerson(mc, person);

        } else if (req.query.hasOwnProperty("toggleMovieWatchlist")) {
            let movie = req.query.toggleMovieWatchlist;

            if (!await dbTools.getMovie(mc, movie)) {
                res.status(404).send("Could not find movie.");
                return;
            }

            await helper.toggleMovieWatchlist(mc, user, movie);

        } else if (req.query.hasOwnProperty("toggleFollowUser")) {
            let userToFollow = req.query.toggleFollowUser;

            if (!(userToFollow = await dbTools.getUser(mc, userToFollow))) {
                res.status(404).send("Could not find user");
                return;
            }

            await helper.toggleUserFollow(mc, user, userToFollow);

        } else if (req.query.hasOwnProperty("removeNotification")) {
            let index = parseInt(req.query.removeNotification);

            if (!user.hasOwnProperty("notifications") || user.notifications.length - 1 < index) {
                res.status(404).send("Notification not found");
                return;
            }

            let dec = false;
            user.notifications = user.notifications.map(item => {
                if (dec) {
                    item["index"]--;
                }

                if (!dec && item["index"] === index) {
                    dec = true;
                    item["index"] = -1;
                }

                return item;
            });


            user.notifications = user.notifications.filter(item => item["index"] !== -1);
        }

        res.status(200).send();

        await dbTools.updateUser(mc, user);
    }
}

async function getOwnProfile(req, res) {
    if (!req.session.loggedIn) {
        res.redirect("/signin");
        return;
    }

    let user = await dbTools.getUser(mc, req.session.username);

    if (!user) {
        res.status(404).send("Could not find user");
        return;
    }

    let url = decodeURIComponent(req.url).split("/");

    if (url.length === 4 && url[2] === "notification") {
        let index = url[3];

        if (user.hasOwnProperty("notifications") && user.notifications && user.notifications[index]) {
            res.render("notification", {notification: user.notifications[index]});
        } else {
            res.status(404).send("Notification not found");
        }
        return;
    }

    // generate new recommended movies everytime the page is loaded
    let recMovies = await movieTools.generateRecMovies(mc, user, REC_MOVIE_LIST);

    res.render("ownProfile", {user: user, recMovies: recMovies});
}

async function putReview(req, res, username, review) {
    review["basic"] = review.summary === "";

    let movie = await dbTools.getMovie(mc, review.movie);

    if (!movie) {
        res.status(404).send("Could not find movie");
        return;
    }

    let user = await dbTools.getUser(mc, username);

    if (!user) {
        res.status(404).send("User either doesn't exist or isn't logged in");
        return;
    }

    if (!user.hasOwnProperty("reviews")) {
        user["reviews"] = [];
    }

    if (user.reviews.some(item => {
        return item.movie === movie.Title;
    })) {
        res.status(404).send("User has already reviewed movie");
        return;
    }

    if (!movie.hasOwnProperty("reviews")) {
        movie["reviews"] = [];
    }

    user.reviews.push({movie: movie.Title, index: movie.reviews.length});

    await helper.addNotification(mc, user, user.username + " has published a new review for " + movie.Title);

    movie.reviews.push({
        basic: review.basic,
        summary: review.summary,
        text: review.text,
        rating: parseInt(review.rating),
        user: username
    });

    res.status(200).send();

    await dbTools.updateUser(mc, user);
    await dbTools.updateMovie(mc, movie);
}

async function searchResults(req, res) {
    let title;
    let year;
    let persons;
    let genre;

    if (req.query.hasOwnProperty("title")) {
        title = decodeURIComponent(req.query.title);
    }
    if (req.query.hasOwnProperty("year")) {
        year = decodeURIComponent(req.query.year);
    }
    if (req.query.hasOwnProperty("persons")) {
        // remove the space after the comma
        persons = helper.removeDuplicates(helper.fixSpaceAfterComma(decodeURIComponent(req.query.persons)).split(","));
    }
    if (req.query.hasOwnProperty("genre")) {
        genre = helper.removeDuplicates(helper.fixSpaceAfterComma(decodeURIComponent(req.query.genre)).split(","));
    }

    res.status(200).send(JSON.stringify(movieTools.search(await dbTools.getMovies(mc), title, year, persons, genre)));
}

async function contribute(req, res) {
    let user = await dbTools.getUser(mc, req.session.username);

    if (user && user["isContributing"]) {
        res.render("contribute", {access: true});
    } else {
        res.render("contribute", {access: false});
    }
}

function logOut(req, res) {
    if (req.session.loggedIn) {
        req.session.loggedIn = false;
        req.session.username = undefined;
        res.status(200).send("Logged out.");
    } else {
        res.status(401).send("Not logged in");
    }
}

async function createAccount(req, res, data) {
    let username = data.username
    let password = data.password;

    if (await dbTools.getUser(mc, username)) {
        res.status(401).send("Username already taken");
    } else {
        if ((username.length <= 0 || password.length <= 0) || !helper.verifyStr(username, INVALID_USER_CHARS)) {
            res.status(401).send("Error, please check to make sure that non of the entries are blank, " +
                "there are no spaces in the username or special characters.");
            return;
        }

        let objDate = new Date();
        let date = objDate.getDate() + "/" + objDate.getMonth() + 1 + "/" + objDate.getFullYear();

        await dbTools.addUser(mc, {username: username, password: password, isContributing: false, dateJoined: date});

        login(req, res, username, password, true);
    }
}

async function login(req, res, username, password, skipVerify) {
    if (!skipVerify) {
        let user = await dbTools.getUser(mc, username);

        if (!user || !(user.password === password)) {
            res.status(401).send("Invalid credentials");
            return;
        }
    }

    if (!req.session.loggedIn) {
        req.session.loggedIn = true;
        req.session.username = username;
    }

    res.status(200).send("Complete");
}

async function getPeopleProfile(req, res) {
    let people = await dbTools.getPeople(mc);

    let names = [];

    people.forEach(person => {
        names.push(person.name);
    });

    res.status(200).send(JSON.stringify(names));
}

async function postPeopleProfile(req, res) {
    if (req.session.loggedIn) {
        let user = await dbTools.getUser(mc, req.session.username);

        if (!(user && user.isContributing)) {
            res.status(404).send("User is not a contributing user");
            return;
        }
    } else {
        res.status(404).send("User not logged in");
        return;
    }

    if (req.query.hasOwnProperty("addPerson")) {
        let person = req.query.addPerson;

        if (person === "" || !helper.verifyStr(person, INVALID_USER_CHARS)) {
            res.status(404).send("Special chars nor blank name is allowed");
            return;
        }

        person = helper.formatTitle(decodeURIComponent(req.query.addPerson));

        if (await dbTools.getPerson(mc, person)) {
            res.status(404).send(person + " already exists in database");
            return;
        }

        res.status(200).send(person);

        await dbTools.addPerson(mc, {name: person});
    }
}

async function getPeopleProfileMore(req, res) {
    let url = decodeURIComponent(req.url).split("/");
    let name;

    // allow data to be shown for all non-applicable users
    if (url[2] === "N" && url[3] === "A") {
        name = "N/A";
    } else {
        name = url[2];
    }

    let person = await dbTools.getPerson(mc, name);

    if (!person) {
        res.status(404).send("Person not found");
        return;
    }

    // check if person has properties
    if (!person.hasOwnProperty("collabs") || newMovieAdded) {
        newMovieAdded = false;
        let movies = await dbTools.getMovies(mc);
        let new_person = movieTools.setPersonInfo(movies, person);

        if (new_person) {
            person = new_person;
            person["collabs"] = await movieTools.getCollabs(mc, person, FREQ_CONTRIBUTORS_LIST);
            await dbTools.updatePerson(mc, person);
        }
    }

    let isFollowed = false;

    if (req.session.loggedIn) {
        let user = await dbTools.getUser(mc, req.session.username);
        isFollowed = helper.userFollowingPerson(user, person.name);
    }

    res.render("peopleProfile", {person: person, isFollowed: isFollowed, isUser: req.session.loggedIn});
}

async function getUserProfileMore(req, res) {
    let user = await dbTools.getUser(mc, decodeURIComponent(req.url).split("/")[2]);

    if (!user) {
        res.status(404).send("User not found");
        return;
    }

    let isFollowed = false;
    let viewingUser;

    if (req.session.loggedIn) {
        if (req.session.username === user.username) {
            res.redirect("/ownProfile");
            return;
        }

        viewingUser = await dbTools.getUser(mc, req.session.username);

        if (viewingUser) {
            if (viewingUser.hasOwnProperty("userFollowers") && viewingUser.userFollowers.includes(user.username)) {
                isFollowed = true;
            }
        }
    }

    res.render("userProfile", {user: user, isFollowed: isFollowed, viewingUser: viewingUser});
}

async function getGenre(req, res) {
    let genres = await dbTools.getGenres(mc);

    if (req.query.hasOwnProperty("genre")) {
        let genre = req.query.genre;

        if (!genres.includes(genre)) {
            res.status(404).send();
            return;
        }

        let list = movieTools.getMoviesByGenre(genre, await dbTools.getMovies(mc));

        res.status(200).send(JSON.stringify(list));
    } else {
        res.status(200).send(JSON.stringify(genres));
    }
}

async function getUsers(req, res) {
    let users = await dbTools.getUsers(mc);

    let usersToShow;

    if (users.length > USERS_TO_SHOW) {
        usersToShow = users.slice(users.length - USERS_TO_SHOW, users.length);
    } else {
        usersToShow = users;
    }

    res.render("users", {users: usersToShow});
}

async function allMoviesMore(req, res) {
    let url = decodeURIComponent(req.url).split("/");

    let movie = null;

    if (url.length >= 3) {
        // decode to allow for special characters
        movie = await dbTools.getMovie(mc, url[2].toString());

        if (movie == null) {
            res.status(404).send("Movie not found.");
            return;
        }
    }

    if (url.length === 5 && url[3] === "reviews") {
        let index = url[4];
        if (movie.hasOwnProperty("reviews") && movie.reviews && movie.reviews[index]) {
            res.render("review", {review: movie.reviews[index]});
        } else {
            res.status(404).send("Full review not found.");
        }

    } else if (url.length === 3) {
        if (!movie.hasOwnProperty("similar") || newMovieAdded) {
            newMovieAdded = false;
            movie["similar"] = movieTools.generateSimilarMovies(movie, await dbTools.getMovies(mc), SIMILAR_MOVIE_LIST_SIZE);
            await dbTools.updateMovie(mc, movie);
        }

        movie["rating"] = movieTools.calculateRating(movie);

        let inWatchList = false;

        let user = await dbTools.getUser(mc, req.session.username);

        if (user) {
            inWatchList = movieTools.movieInUserWatchList(movie.Title, user);
        }

        let isAFullReview = false;

        if (movie.hasOwnProperty("reviews")) {
            isAFullReview = movie.reviews.some(review => {
                return !review.basic;
            });
        }

        res.render("movie", {
            movie: movie,
            watchList: inWatchList,
            user: user,
            isAFullReview: isAFullReview
        });
    } else {
        res.status(404).send("Not found");
    }
}

async function postMovie(req, res) {
    if (req.session.loggedIn) {
        let user = await dbTools.getUser(mc, req.session.username);

        if (!(user && user.isContributing)) {
            res.status(404).send("User is not a contributing user");
            return;
        }
    } else {
        res.status(404).send("User not logged in");
        return;
    }

    if (!(req.query.hasOwnProperty("title") && req.query.hasOwnProperty("runtime") &&
        req.query.hasOwnProperty("releaseYear") && req.query.hasOwnProperty("rating") &&
        req.query.hasOwnProperty("writer") && req.query.hasOwnProperty("director") &&
        req.query.hasOwnProperty("actors")) && req.query.hasOwnProperty("genre") &&
        req.query.hasOwnProperty("plot")) {

        res.status(404).send("Missing data for movie");
        return;
    }

    let title = decodeURIComponent(req.query.title);
    let runtime = decodeURIComponent(req.query.runtime);
    let releaseYear = decodeURIComponent(req.query.releaseYear);
    let rating = decodeURIComponent(req.query.rating);

    // remove space after the comma
    let lGenre = helper.fixSpaceAfterComma(decodeURIComponent(req.query.genre));
    let writer = helper.fixSpaceAfterComma(decodeURIComponent(req.query.writer));
    let director = helper.fixSpaceAfterComma(decodeURIComponent(req.query.director));
    let actors = helper.fixSpaceAfterComma(decodeURIComponent(req.query.actors));
    let plot = decodeURIComponent(req.query.plot);
    let poster = "";

    if (req.query.hasOwnProperty("poster")) {
        poster = decodeURIComponent(req.query.poster);
    }

    if (title === "" || runtime === "" || releaseYear === "" || rating === "" || plot === "" || lGenre === ""
        || writer === "" || director === "" || actors === "") {

        res.status(404).send("Missing data for movie");
        return;
    }

    if (await dbTools.getMovie(mc, title)) {
        res.status(404).send("Movie with title " + title + " already exists");
        return;
    }

    if (!helper.isStrInt(runtime)) {
        res.status(404).send("Please put numerical value for runtime in minutes only");
        return;
    }

    if (!helper.isStrInt(releaseYear)) {
        res.status(404).send("Please put numerical value for the release year");
        return;
    }

    lGenre = lGenre.split(",");
    let writers = writer.split(",");
    let directors = director.split(",");
    let actorsS = actors.split(",");

    if (writers.length <= 0 || directors.length <= 0 || actorsS.length <= 0) {
        res.status(404).send("You must have at least one writer, director and actor");
        return;
    }

    writers = helper.removeDuplicates(writers);
    directors = helper.removeDuplicates(directors);
    actorsS = helper.removeDuplicates(actorsS);
    lGenre = helper.removeDuplicates(lGenre);

    if (lGenre.length <= 0) {
        res.status(404).send("You must have at least one genre");
        return;
    }

    if (!await helper.verifyPeople(mc, writers, directors, actorsS)) {
        res.status(404).send("All people not found in database, please add them first");
        return;
    }

    lGenre = lGenre.map(item => {
        return helper.formatTitle(item);
    });

    for (let i = 0; i < lGenre.length; i++) {
        if (!helper.verifyStr(lGenre [i], INVALID_USER_CHARS)) {
            res.status(4040).send("Genre(s) cannot have special characters");
            return;
        }
    }

    movie = {
        Title: title, Year: releaseYear, Rated: rating, Runtime: runtime + " min",
        Genre: lGenre, Director: directors, Writer: writers, Actors: actorsS, Plot: plot, Poster: poster
    };

    await dbTools.addMovie(mc, movie);

    let genres = await dbTools.getGenres(mc);

    let newGenre = false;
    for (let i = 0; i < lGenre.length; i++) {
        if (!genres.includes(lGenre[i])) {
            genres.push(lGenre[i]);
            newGenre = true;
        }
    }

    if (newGenre) {
        await dbTools.setGenres(mc, genres);
    }

    newMovieAdded = true;

    res.status(200).send(movie.Title);

    // notify
    let lPeople = [].concat(directors, writers, actorsS);
    lPeople = helper.removeDuplicates(lPeople);

    for (let pPerson of lPeople) {
        pPerson = await dbTools.getPerson(mc, pPerson);
        if (pPerson) {
            await helper.addNotification(mc, pPerson, pPerson.name + " was involved in the new movie " + movie.Title);
        }
    }
}

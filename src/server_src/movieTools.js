const movieTools = {}

const helper = require('./helper');
const dbTools = require("./dbTools");

function compareScore(a, b) {
    return (a.sc > b.sc) ? -1 : 1
}

movieTools.parseMovie = (movie) => {
    // format special characters for urls

    if (movie.Title.includes("/")) {
        movie.Title = movie.Title.replace(new RegExp("/", "g"), "∕");
    }
    if (movie.Title.includes("&")) {
        movie.Title = movie.Title.replace(new RegExp("&", "g"), "＆");
    }
    if (movie.Title.includes("'")) {
        movie.Title = movie.Title.replace(new RegExp("'", "g"), "ʻ");
    }
    if (movie.Title.includes("#")) {
        movie.Title = movie.Title.replace(new RegExp("#", "g"), "⋕");
    }
    if (movie.Title.includes("?")) {
        movie.Title = movie.Title.replace(new RegExp("\\?", "g"), "﹖");
    }
    if (movie.Title.includes("%")) {
        movie.Title = movie.Title.replace(new RegExp("%", "g"), "⁒");
    }
    if (movie.Title.includes(",")) {
        movie.Title = movie.Title.replace(new RegExp(",", "g"), "﹐");
    }

    movie.Title = helper.formatTitle(movie.Title);

    return movie;
}

movieTools.parseMovies = (movies) => {
    // remove #DUPE#
    movies = movies.filter(item => item.Title !== "#DUPE#");

    return movies.map(item => { return movieTools.parseMovie(item); });
}

movieTools.getGenres = (movies) => {
    let genres = [];
    movies.forEach(item => {
        item.Genre.forEach(genre => {
            if (!genres.includes(genre)) {
                genres.push(genre);
            }
        });
    });

    return genres;
}

movieTools.search = (movies, title, year, persons, genre) => {
    const NO_PARAM_COUNT = 1000;
    const MATCHING_TITLE_PTS = 8;
    const MATCHING_TITLE_PTS_EXACT = 10;
    const EXACT_YEAR = 6;
    const MATCHING_PERSONS = 5;
    const MATCHING_PERSONS_EXACT = 5;
    const MATCHING_GENRE = 4;

    if (!title && !year && !persons && !genre) {
        let list = [];
        helper.shuffleArr(movies.slice(0, NO_PARAM_COUNT)).forEach(item => {
            list.push(item.Title);
        });

        return list;
    }

    if (title) {
        title = title.toLowerCase();
    }

    if (persons) {
        persons = persons.map(name => name.toLowerCase());
        persons = helper.removeDuplicates(persons);
    }

    if (genre) {
        genre = genre.map(name => name.toLowerCase());
        genre = helper.removeDuplicates(genre);
    }

    let movieScore = [];
    let count = 0;

    movies.forEach(item => {
        let pts = 0;

        if (title) {
            if (item.Title.toLowerCase() === title) {
                pts += MATCHING_TITLE_PTS_EXACT;
            } else if (item.Title.toLowerCase().indexOf(title) !== -1) {
                pts += MATCHING_TITLE_PTS;
            }
        }

        if (year) {
            if (item.Year === year) {
                pts += EXACT_YEAR;
            }
        }

        if (persons) {
            persons.forEach(pPerson => {
                item.Writer.forEach(writer => {
                    writer = writer.toLowerCase();
                    if (writer === pPerson) {
                        pts += MATCHING_PERSONS_EXACT;
                    } else if (writer.indexOf(pPerson) !== -1) {
                        pts += MATCHING_PERSONS;
                    }
                });

                item.Director.forEach(director => {
                    director = director.toLowerCase();
                    if (director === pPerson) {
                        pts += MATCHING_PERSONS_EXACT;
                    } else if (director.indexOf(pPerson) !== -1) {
                        pts += MATCHING_PERSONS;
                    }
                });

                item.Actors.forEach(actor => {
                    actor = actor.toLowerCase();
                    if (actor === pPerson) {
                        pts += MATCHING_PERSONS_EXACT;
                    } else if (actor.indexOf(pPerson) !== -1) {
                        pts += MATCHING_PERSONS;
                    }
                });
            });
        }

        if (genre) {
            item.Genre.forEach(pGenre => {
                genre.forEach(argGenre => {
                    if (pGenre.toLowerCase() === argGenre.toLowerCase()) {
                        pts += MATCHING_GENRE;
                    }
                });
            });
        }

        movieScore[count] = {mov: item.Title, sc: pts};
        count++;
    });

    movieScore.sort(compareScore);

    let titles = [];

    movieScore.forEach(item => {
        if (item.sc > 0) {
            titles.push(item.mov);
        }
    });

    return titles;
}

movieTools.onlyTitles = (list) => {
    let titles = [];
    list.forEach(item => {
        titles.push(item.Title);
    });

    return titles;
}

movieTools.generateRecMovies = async (mc, user, listSize) => {
    let movies = await dbTools.getMovies(mc);

    if (listSize >= movies.length) {
        return movieTools.onlyTitles(movies);
    }

    if (!user.movieWatchlist || user.movieWatchlist.length <= 0) {
        return movieTools.onlyTitles(movies.slice(0, listSize));
    }

    let moviesWatchListObject = [];

    for (const item of user.movieWatchlist) {
       let movie = await dbTools.getMovie(mc, item);

       if (movie) {
           moviesWatchListObject.push(movie);
       }
    }

    return movieTools.similar(moviesWatchListObject, movies, listSize)
}

movieTools.generateSimilarMovies = (movie, movies, listSize) => {
    if (listSize >= movies.length) {
        return movieTools.onlyTitles(movies);
    }

    if (!movie) {
        return movieTools.onlyTitles(movies.slice(0, listSize));
    }

    return movieTools.similar([movie], movies, listSize)

}

movieTools.similar = (list, movies, listSize) => {
    const SAME_GENRE_PTS = 2;
    const SAME_YEAR_PTS = 1;
    const SAME_RATING_PTS = 1;
    const SAME_PERSON_PTS = 2;

    let scoreSimilar = [];


    let count = 0
    for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < movies.length; j++) {
            let bContinue = false;

            // make sure recommended movie is not a movie in the watched list
            for (let k = 0; k < list.length; k++) {
                if (list[k].Title === movies[j].Title) {
                    bContinue = true;
                    break;
                }
            }

            if (bContinue) {
                continue;
            }

            let score = 0;

            list[i].Genre.forEach(genre => {
                movies[j].Genre.forEach(genre2 => {
                    if (genre === genre2) {
                        score += SAME_GENRE_PTS;
                    }
                });
            });

            if (list[i].Year === movies[j].Year) {
                score += SAME_YEAR_PTS;
            }

            if (list[i].Rating === movies[j].Rating) {
                score += SAME_RATING_PTS;
            }

            list[i].Writer.forEach(writer => {
                movies[j].Writer.forEach(writer2 => {
                    if (writer === writer2) {
                        score += SAME_PERSON_PTS;
                    }
                });
            });

            list[i].Actors.forEach(actor => {
                movies[j].Actors.forEach(actor2 => {
                    if (actor === actor2) {
                        score += SAME_PERSON_PTS;
                    }
                });
            });

            list[i].Director.forEach(director => {
                movies[j].Director.forEach(director2 => {
                    if (director === director2) {
                        score += SAME_PERSON_PTS;
                    }
                });
            });

            scoreSimilar[count] = {mov: movies[j].Title, sc: score};
            count++;
        }
    }

    scoreSimilar.sort(compareScore);
    scoreSimilar = scoreSimilar.slice(0, listSize);

    let titles = [];

    scoreSimilar.forEach(item => {
        titles.push(item.mov);
    });

    return titles;
}

movieTools.movieInUserWatchList = (title, user) => {
    if (!user.hasOwnProperty("movieWatchlist")) {
        return false;
    }

    for (let i = 0; i < user.movieWatchlist.length; i++) {
        if (title.toLowerCase() === user.movieWatchlist[i].toLowerCase()) {
            return true;
        }
    }

    return false;
}

movieTools.calculateRating = (movie) => {
    if (!movie.hasOwnProperty("reviews")) {
        return 0;
    }

    let rating = 0;

    movie.reviews.forEach(item => {
        rating += item.rating;
    });

    rating = Math.round(rating / movie.reviews.length);

    if (rating > 5) {
        return 5;
    } else {
        return rating;
    }
}

movieTools.personContributed = (movies, person) => {
    let results = {actor: [], writer: [], director: []};

    movies.forEach(item => {
        item.Actors.forEach(actor => {
            if (actor === person.name) {
                results.actor.push(item.Title);
            }
        });
        item.Writer.forEach(writer => {
            if (writer === person.name) {
                results.writer.push(item.Title);
            }
        });
        item.Director.forEach(director => {
            if (director === person.name) {
                results.director.push(item.Title);
            }
        });
    });

    if (results.actor.length === 0 && results.writer.length === 0 && results.director.length === 0) {
        return null;
    }

    return results;
}

movieTools.getUniquePeople = (movies) => {
    let people = [];

    movies.forEach(item => {
        item.Actors.forEach(person => {
            if (!people.includes(person)) {
                people.push(person);
            }
        });
        item.Writer.forEach(person => {
            if (!people.includes(person)) {
                people.push(person);
            }
        });
        item.Director.forEach(person => {
            if (!people.includes(person)) {
                people.push(person);
            }
        });
    });

    let peopleObjectArr = [];

    people.forEach(item => {
        peopleObjectArr.push({name: item});
    });

    return peopleObjectArr;
}

movieTools.getCollabs = async (mc, pPerson, listSize) => {
    let movies = [];
    let users = [];

    movies = movies.concat(pPerson.actor);
    movies = movies.concat(pPerson.writer);
    movies = movies.concat(pPerson.director);

    movies = await Promise.all(movies.map(async item => await dbTools.getMovie(mc, item)));

    movies.forEach(item => {
        if (!item) {
            return;
        }

        item.Actors.forEach(person => {
            let found = false;
            for (let i = 0; i < users.length; i++) {
                if (users[i].name === person) {
                    users[i].sc++;
                    found = true;
                    break;
                }
            }

            if (!found) {
                if (person !== pPerson.name) {
                    users.push({name: person, sc: 1});
                }
            }
        });
        item.Writer.forEach(person => {
            let found = false;
            for (let i = 0; i < users.length; i++) {
                if (users[i].name === person) {
                    users[i].sc++;
                    found = true;
                    break;
                }
            }

            if (!found) {
                if (person !== pPerson.name) {
                    users.push({name: person, sc: 1});
                }
            }
        });
        item.Director.forEach(person => {
            let found = false;
            for (let i = 0; i < users.length; i++) {
                if (users[i].name === person) {
                    users[i].sc++;
                    found = true;
                    break;
                }
            }

            if (!found) {
                if (person !== pPerson.name) {
                    users.push({name: person, sc: 1});
                }
            }
        });
    });

    users.sort(compareScore);
    users = users.slice(0, listSize);

    let names = [];
    users.forEach(item => {
        names.push(item.name);
    });

    return names;
}

movieTools.setPersonInfo = (movies, person) => {
    let results = movieTools.personContributed(movies, person);
    if (!results) return results;

    person["actor"] = results.actor;
    person["writer"] = results.writer;
    person["director"] = results.director;

    return person;
}

movieTools.getMoviesByGenre = (genre, movies) => {
    let list = [];

    movies.forEach(item => {
        item.Genre.forEach(pGenre => {
            if (pGenre === genre) {
                list.push(item.Title);
            }
        });
    });

    return list;
}

module.exports = movieTools
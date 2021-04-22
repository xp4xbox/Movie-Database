const dbTools = require("./dbTools");
const helper = {}

helper.contains = (arr, key, value) => {
    for (let i = 0; i < arr.length; i++) {
        let item = arr[i];
        if (item[key] === value) {
            return true;
        }
    }

    return false;
}

helper.generateRandomStr = (len) => {
    let str = "";
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    for (let i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
}

helper.userFollowingPerson = (user, follow) => {
    if (!user.hasOwnProperty("peopleFollowers")) {
        return false;
    }

    for (let i = 0; i < user.peopleFollowers.length; i++) {
        if (user.peopleFollowers[i] === follow) {
            return true;
        }
    }

    return false;
}

helper.shuffleArr = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    return arr;
}

helper.toggleMovieWatchlist = async (mc, user, movie) => {
    if (!user.hasOwnProperty("movieWatchlist")) {
        user["movieWatchlist"] = [];
    }

    const index = user["movieWatchlist"].indexOf(movie);

    if (index > -1) {
        user["movieWatchlist"].splice(index, 1);
        await helper.addNotification(mc, user,user.username + " has removed " + movie + " from their watchlist");
    } else {
        user["movieWatchlist"].push(movie);
        await helper.addNotification(mc, user,user.username + " has added " + movie + " to their watchlist");
    }

    await dbTools.updateUser(mc, user);
}

helper.toggleProperty = (user, property, value) => {
    let returnValue = false;

    if (user.hasOwnProperty(property)) {
        const index = user[property].indexOf(value);

        if (index > -1) {
            user[property].splice(index, 1);
        } else {
            user[property].push(value);
        }
    } else {
        user[property] = [value];
    }

    return user;
}

helper.toggleUserFollow = async (mc, user, userToFollow) => {
    if (!user.hasOwnProperty("userFollowers")) {
        user["userFollowers"] = [];
    }

    const index = user["userFollowers"].indexOf(userToFollow.username);

    if (index > -1) {
        user["userFollowers"].splice(index, 1);
        await helper.addNotification(mc, user,user.username + " has unfollowed " + userToFollow.username)
    } else {
        user["userFollowers"].push(userToFollow.username);
        await helper.addNotification(mc, user,user.username + " has followed " + userToFollow.username)
    }

    helper.toggleProperty(userToFollow, "userFollowersSelf", user.username);
    await dbTools.updateUser(mc, userToFollow);
}

helper.togglePeopleFollow = async (mc, user, person) => {
    if (!user.hasOwnProperty("peopleFollowers")) {
        user["peopleFollowers"] = [];
    }

    const index = user["peopleFollowers"].indexOf(person.name);

    if (index > -1) {
        user["peopleFollowers"].splice(index, 1);
        await helper.addNotification(mc, user,user.username + " has unfollowed " + person.name);
    } else {
        user["peopleFollowers"].push(person.name);
        await helper.addNotification(mc, user,user.username + " has followed " + person.name);
    }

    helper.toggleProperty(person, "userFollowersSelf", user.username);
    await dbTools.updatePerson(mc, person);
}

helper.addNotification = async (mc, user, notification) => {
    if (!user.hasOwnProperty("userFollowersSelf")) {
        return;
    }

    for (let i = 0; i < user["userFollowersSelf"].length; i++) {

        let lUser = await dbTools.getUser(mc, user.userFollowersSelf[i]);

        if (lUser) {
            if (!lUser.hasOwnProperty("notifications")) {
                lUser["notifications"] = [];
            }

            lUser.notifications.push({text: notification.toString(), index: lUser.notifications.length, date: helper.getDateAndTime()});
            await dbTools.updateUser(mc, lUser);
        }
    }
}

helper.formatTitle = (str) => {
    let arrStr = str.split(" ");

    return arrStr.map(item => {
        return item.charAt(0).toUpperCase() + item.substr(1, item.length);
    }).join().replace(new RegExp(",", "g"), " ");
}

helper.verifyStr = (str, invalidChars) => {
    for (let i = 0; i < invalidChars.length; i++) {
        if (str.includes(invalidChars[i])) {
            return false;
        }
    }

    return true;
}

helper.verifyPeople = async (mc, writer, director, actors) => {
    let people = [].concat(writer, director, actors);
    people = helper.removeDuplicates(people);

    let valid = 0;

    for (let j = 0; j < people.length; j++) {
        if (await dbTools.getPerson(mc, helper.formatTitle(people[j]))) {
            valid++;
        }
    }

    return valid >= people.length;
}

// from https://ajahne.github.io/blog/javascript/2020/02/04/how-to-remove-duplicates-from-an-array-in-javascript.html
helper.removeDuplicates = (array) => {
    const result = [];
    for (let i = 0; i < array.length; i++) {
        let exists = false;
        for (let j = 0; j < result.length; j++) {
            if (array[i] === result[j]) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            result.push(array[i]);
        }
    }
    return result;
}

helper.fixSpaceAfterComma = (str) => {
    return str.replace(/\s*,\s*/g, ",");
}

helper.isStrInt = (str) => {
    return (/^-?\d+$/).test(str);
}

helper.getDateAndTime = () => {
    let date = new Date();
    return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + " @ " +
        date.getHours() + ":" + date.getMinutes();
}

module.exports = helper
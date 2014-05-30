define(["jquery", "util", "config"], function (jquery, util, config) {
    return {
        version: function (portal) {
            // Returns the version of the portal.
            return jquery.ajax({
                type: "GET",
                url: portal + "sharing/rest?f=json",
                dataType: "json"
            });
        },
        self: function (portal, token) {
            // Return the view of the portal as seen by the current user, anonymous or logged in.
            return jquery.ajax({
                type: "GET",
                url: portal + "sharing/rest/portals/self?" + jquery.param({
                    token: token,
                    f: "json"
                }),
                dataType: "json"
            });
        },
        generateToken: function (portal, username, password) {
            // Generates an access token in exchange for user credentials that can be used by clients when working with the ArcGIS Portal API.
            return jquery.ajax({
                type: "POST",
                url: portal + "sharing/rest/generateToken?",
                data: {
                    username: username,
                    password: password,
                    referer: jquery(location).attr("hostname"), // URL of the sending app.
                    expiration: 60, // Lifetime of the token in minutes.
                    f: "json"
                },
                dataType: "json"
            });
        },
        search: function (portal, query, numResults, start, sortField, sortOrder, token) {
            // Searches using the provided query string and returns all results.
            var total,
                nextStart = 101,
                deferred = $.Deferred(),
                allResults = [],
                x = 1,
                searchIt = $.ajax({
                    type: "GET",
                    url: portal + "sharing/rest/search?",
                    data: {
                        q: query,
                        num: numResults || 100,
                        start: start || 1,
                        sortField: sortField || "numViews",
                        sortOrder: sortOrder || "desc",
                        token: token,
                        f: "json"
                    },
                    dataType: "json"
                });

            $.ajax({
                type: "GET",
                url: portal + "sharing/rest/search?",
                data: {
                    q: query,
                    num: numResults || 100,
                    start: start || 1,
                    sortField: sortField || "numViews",
                    sortOrder: sortOrder || "desc",
                    token: token,
                    f: "json"
                },
                dataType: "json"
            })
                .done(function (search) {
                    allResults.push.apply(allResults, search.results);
                    total = search.total;
                    do {
                        $.ajax({
                            type: "GET",
                            url: portal + "sharing/rest/search?",
                            data: {
                                q: query,
                                num: numResults || 100,
                                start: nextStart || 1,
                                sortField: sortField || "numViews",
                                sortOrder: sortOrder || "desc",
                                token: token,
                                f: "json"
                            },
                            dataType: "json"
                        })
                            .done(function (search) {
                                quickResults = search;
                                allResults.push.apply(allResults, search.results);
                                if (allResults.length === total) {
                                    deferred.resolve(allResults);
                                }
                            });
                        x = x + 1;
                        nextStart = nextStart + 100;
                    }
                    while (nextStart < total);
                });
            return deferred.promise();
        },
        user: {
            profile: function (portal, username, token) {
                // 
                return jquery.ajax({
                    type: "GET",
                    url: portal + "sharing/rest/community/users/" + username + "?",
                    data: {
                        token: token,
                        f: "json"
                    },
                    dataType: "json"
                });
            },
            content: function (portal, username, folder, token) {
                // 
                return jquery.ajax({
                    type: "GET",
                    url: portal + "sharing/rest/content/users/" + username + "/" + folder + "?",
                    data: {
                        token: token,
                        f: "json"
                    },
                    dataType: "json"
                });
            },
        },
        content: {
            itemDescription: function (portal, id, token) {
                // 
                return jquery.ajax({
                    type: "GET",
                    url: portal + "sharing/rest/content/items/" + id + "?",
                    data: {
                        token: token,
                        f: "json"
                    },
                    dataType: "json"
                });
            },
            itemData: function (portal, id, token) {
                // 
                return jquery.ajax({
                    type: "GET",
                    url: portal + "sharing/rest/content/items/" + id + "/data?",
                    data: {
                        token: token,
                        f: "json"
                    },
                    dataType: "json"
                });
            },
            addItem: function (portal, username, folder, description, data, thumbnailUrl, token) {
                // Create a new item on the specified portal.

                // Clean up description items for posting.
                // This is necessary because some of the item descriptions (e.g. tags and extent)
                // are returned as arrays, but the post operation expects comma separated strings.
                jquery.each(description, function (item, value) {
                    if (value === null) {
                        description[item] = "";
                    } else if (value instanceof Array) {
                        description[item] = util.arrayToString(value);
                    }
                });

                // Create a new item in a user's content.
                var params = {
                    item: description.title,
                    text: JSON.stringify(data), // Stringify the Javascript object so it can be properly sent.
                    overwrite: false, // Prevent users from accidentally overwriting items with the same name.
                    thumbnailurl: thumbnailUrl,
                    f: "json",
                    token: token
                };
                return jquery.ajax({
                    type: "POST",
                    url: portal + "sharing/rest/content/users/" + username + "/" + folder + "/addItem?",
                    data: jquery.extend(description, params), // Merge the description and params JSON objects.
                    dataType: "json"
                });
            },
            updateWebmapData: function (portal, username, folder, id, data, token) {
                // Update the content in a web map.
                return jquery.ajax({
                    type: "POST",
                    url: portal + "sharing/rest/content/users/" + username + "/" + folder + "/items/" + id + "/update?",
                    data: {
                        text: JSON.stringify(data), // Stringify the Javascript object so it can be properly sent.
                        token: token,
                        f: "json"
                    },
                    dataType: "json"
                });
            },
            updateUrl: function (portal, username, folder, id, url, token) {
                // Update the URL of a registered service or web application.
                return $.ajax({
                    type: "POST",
                    url: portal + "sharing/rest/content/users/" + username + "/" + folder + "/items/" + id + "/update?",
                    data: {
                        url: url,
                        token: token,
                        f: "json"
                    },
                    dataType: "json"
                });
            }
        }
    };
});
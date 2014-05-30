requirejs.config({
    baseUrl: './',
    paths: {
        "jquery": "lib/jquery-1.11.0.min",
        "jquery.bootstrap": "lib/bootstrap/js/bootstrap.min",
        "portal": "js/portal/portal",
        "util": "js/portal/util",
        "config": "js/config",
        "lodash": "lib/lodash-2.4.1.min"
    },
    shim: {
        "jquery.bootstrap": {
            deps: ["jquery"],
        },
        "portal": {
            deps: ["jquery", "util", "config"]
        },
    }
});

require([
    "jquery",
    "portal",
    "util",
    "config",
    "lodash",
    "jquery.bootstrap"
], function (jquery, portal, util, config, _) {
    
    var portalCount = 0,
        resultCount = 0;

    // Set the template to expect {{ mustache }} syntax.
    _.templateSettings = {
        'interpolate': /{{([\s\S]+?)}}/g
    };

    /*_.each(config.portals, function (instance) {
        if (instance.token === undefined) {
            portal.generateToken(instance.url, instance.username, instance.password).done(function(response) {
                instance.token = response.token;
                portal.self(instance.url, instance.token).done(function(response) {
                    instance.id = response.id;
                });
            });
        }
        else {
            portal.self(instance.url, instance.token).done(function(response) {
                instance.id = response.id;
            });
        }
    });*/

    var altThumb = "http://static.arcgis.com/images/desktopapp.png";
    var itemTemplate = _.template('<li class="media"><a class="pull-left" href="{{ portal }}home/item.html?id={{ id }}" target="_blank"><img class="media-object" src="{{ portal }}sharing/rest/content/items/{{ id }}/info/{{ thumbnail }}?token={{ token }}" alt="..."></a><div class="media-body"><h4 class="media-heading">{{ title }}</h4>{{ snippet }}</div></li>');

    function search(query) {
        // Run the query for each portal.
        var x = 0,
            colors = ["info", "warning", "success"];
        _.each(config.portals, function (instance) {
            portalCount++;
            portal.search(instance.url, query, 100, 1, "numViews", "desc", instance.token).done(function (search) {
                jquery.each(search, function (result) {
                    // Add the portal url to the object.
                    search[result].portal = instance.url;
                    search[result].token = instance.token;
                    var itemHtml = itemTemplate(search[result]);
                    jquery("#results").append(itemHtml);
                });
                resultCount += search.length;
                jquery("#resultCount").text(resultCount + " results");
                if (search.length > 0) {
                    updateProgressBar(instance.name, search.length, colors[x]);
                }
//                else {
//                    updateProgressBar(instance.name, 1, colors[x]);
//                }
                x++;
            });
        });
    }
    
    var progressTemplate = _.template('<div class="bar bar-{{ color }}" data-results={{ results }} style="width:{{ width }}%;"><ul><li>{{ name }}</li><li>{{ results }} items</li></ul>');

    function updateProgressBar(name, count, color) {
        var width = count / resultCount;
        jquery("#progressBar").append(progressTemplate({"name": name, "results": count, "width": 10, "color": color}));
        _.each(jquery("#progressBar").children(), function(child) {
            var el = jquery(child);
            width = (el.attr("data-results") / resultCount) * 100;
            el.attr({"style": "width:" + width + "%"});
        });
    }

    function cleanUp() {
        jquery("#results").html("");
        jquery("#progressBar").remove();
        portalCount = 0;
        resultCount = 0;
    }

    jquery("#searchForm").submit(function () {
        cleanUp();
        var keyword = jquery("#inputKeyword").val();
        search(keyword);
        // Add the progress bar to display search stats.
        jquery("#resultStats").after('<div id="progressBar" class="progress span12"></div>');
        return false;
    });

    // Provide typeahead hints for search parameters.
    var searchFields = ["id: ", "itemtype: ", "owner: ", "uploaded: ", "title: ",
                        "type: ", "typekeywords: ", "description: ", "tags: ",
                        "snippet: ", "extent: ", "spatialreference: ", "accessinformation: ",
                        "access: ", "group: ", "numratings: ", "numcomments: ",
                        "avgrating: ", "culture: "];

    jquery("#inputKeyword").typeahead({
        source: searchFields
    });

});
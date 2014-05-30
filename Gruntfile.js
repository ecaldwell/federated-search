module.exports = function (grunt) {
    grunt.initConfig({
        app: {
            url: 'http://myserver.com', // Domain where the app will be hosted.
            proxy: '', // Optional proxy to route all requests through (e.g. http://myserver.com/proxy/proxy.ashx?).
            header: 'src/assets/header.png', // Header image to use for the app.
            expiration: 60, // Lifetime (in minutes) of the tokens. 60=1 hour| 1440=1 day | 10080=1 week
            portals: [
                {
                    "name": "My Portal",
                    "url": "https://webadaptor.domain.com/arcgis/",
                    "username": "admin",
                    "password": "password",
                },
                {
                    "name": "ArcGIS Online (Public)",
                    "url": "https://www.arcgis.com/"
                }
            ],
        },
        markdown: {
            all: {
                files: [
                    {
                        expand: true,
                        src: 'search-cheat-sheet.md',
                        dest: 'build/',
                        ext: '.html'
                    }
                ]
            }
        },
        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['index.html', 'js/**', 'lib/**'],
                        dest: 'build/'
                    },
                    {
                        expand: true,
                        rename: function (dest, src) {
                            return dest + 'header.' + (src.substr(src.lastIndexOf('/') + 1, src.lastIndexOf('.'))).split('.')[1];
                        },
                        src: '<%= app.header %>',
                        dest: 'build/assets/'
                    },
                ]
            },
        },
    });

    grunt.loadNpmTasks('grunt-markdown');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.registerTask('default', ['buildConfig', 'markdown', 'copy']);
    grunt.registerTask('buildConfig', function () {
        // Automatically generate the config file with fresh tokens.

        this.requiresConfig('app');
        this.requiresConfig('app.url');
        this.requiresConfig('app.portals');

        var request = require('request');
        var done = this.async();
        var appConfig = {
            'proxy': grunt.config('app.proxy'),
            'portals': []
        };
        var appUrl = grunt.config('app.url');
        var configFile = 'src/js/config.js';

        //
        function generateToken(portal, username, password, referer, expiration, callback) {
            // Generate a token to be used with requests to the Portal.
            'use strict';
            // Define token parameters.
            var token;
            var data = {
                username: username,
                password: password,
                client: 'referer',
                referer: referer,
                expiration: expiration,
                f: 'json'
            };
            request.post(portal + 'sharing/rest/generateToken', {
                form: data
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    callback(body);
                } else {
                    callback('{"error": "unknown error occurred"}');
                }
            });
        }

        function self(portal, token, callback) {
            // Get information about the Portal.
            'use strict';
            request(portal + 'sharing/rest/portals/self?f=json&token=' + token, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    callback(body);
                }
            });
        }

        function areWeDone(array1, array2) {
            // Check if the config is fully built by comparing the size
            // of the source Portal array and the new config array,
            // then write the config object to a file.
            if (array1.length === array2.length) {
                grunt.file.write(configFile, 'define(' + JSON.stringify(appConfig, null, 4) + ');'); // Write the config file.
                grunt.log.writeln('Config file written to ' + configFile);
                done(); // Tell Grunt we're done.
            }
        }

        grunt.log.writeln('Generating tokens for app hosted at ' + grunt.config('app.url'));
        var portals = grunt.config('app.portals');
        var expiration = grunt.config('app.expiration');
        portals.forEach(function (portal, index, array) {
            var portalConfig = {
                'name': portal.name,
                'url': portal.url,
                'id': '',
                'token': ''
            };
            // Generate a token for each portal.
            generateToken(portal.url, portal.username, portal.password, appUrl, expiration, function (data) {
                if (data && JSON.parse(data).token) {
                    grunt.log.writeln('Successfully authenticated with ' + portal.name);
                    var token = JSON.parse(data).token;
                    // Get the portal ID to be used with search strings.
                    self(portal.url, token, function (response) {
                        var id = JSON.parse(response).user.orgId;
                        portalConfig.token = token;
                        portalConfig.id = id;
                        appConfig.portals.push(portalConfig);
                        areWeDone(appConfig.portals, portals); // Ensure that all async requests are complete.
                    });
                } else {
                    grunt.log.writeln('Failed to get token for ' + portal.name + '. Searches will be for public content only.');
                    appConfig.portals.push(portalConfig);
                    areWeDone(appConfig.portals, portals); // Ensure that all async requests are complete.
                }
            });
        });

    });

};
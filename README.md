# federated-search
A sample application to perform a federated search across multiple instances of Portal for ArcGIS and ArcGIS Online.

## Getting Started
This project uses [Grunt](http://gruntjs.com/) to automate building the application for deployment on a web server. It does a handful of things for you that will make life easier when setting up this application. Most importantly, it will get the tokens needed for an authenticated search and build the config file needed for the app.
#### Without Grunt
  * Modify  `src/js/config.js` with the required information (detailed below) and run the app. You will need to manually generate the tokens if you use this route. 

#### With Grunt
  * Download and install [node.js](http://nodejs.org/).
  * Download or clone this project to your machine.
  * Go to the project folder in your terminal or command window and run `npm install`. (This should automatically download the project's dependencies, including Grunt).
  * Modify the app config in the file `Gruntfile.js` to include specific settings for your app.
    * `url`: where your app will be hosted (try `127.0.0.1` or `localhost` for development)
    * `proxy`: optional proxy url to send requests through
    * `header`: local path to a banner image to use in the app
    * `expiration`: lifetime (in minutes) of the tokens used when searching
    * `portals`: an array of the Portals/ArcGIS Online orgs you want to include in the search. The only required info is `name` and `url`, but to use an authenticated search you need to add a `username` and `password`. These will be used to generate a token that is stored with the application.
      ```
      
      {"name": "My Portal",
       "url": "https://webadaptor.domain.com/arcgis",
       "username": "admin",
       "password": "password"}
       
      ```
  * Run `grunt` from the command line.
  * The config file for the app will be generated and the entire, deployable build will be available in the `build` folder.

Try the advanced search operators or examples in the [cheat sheet](search-cheat-sheet.md).
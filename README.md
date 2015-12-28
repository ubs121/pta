# pta

Public Transportation App

##  Requirements

You must build an application that allows users to select a departure and arrival train station, and see a list of trains, times, and durations. Initially, the application should load a default train schedule - many public transportation agencies offer this information via an API or as a GTFS file (for example,   [CalTrain](http://www.caltrain.com/developer.html) or the My511.org transit data feed). If the application is online, your schedule should reflect real-time transit data, informing the user of any delays they may encounter.

## Evaluation

Your project will be evaluated by a Udacity reviewer according to the rubric below. Be sure to review it thoroughly before you submit. All criteria must "meet specifications" in order to pass.

* **Completion** - App includes all requirements, including departure and arrival times of trains.

* **Responsiveness** - App is equally functional on mobile and desktop, using responsive design to ensure its displayed in a usable state.

* **Offline Functionality** - Application defaults to offline-first functionality, functioning if a network connection doesn't exist.

* **App Delivery** - App includes a build process. Assets are minimized and concatenated as appropriate.


## How ro run locally

Install node.js, gulp and bower.

```sh
$ npm install
$ bower install
$ npm install -g gulp
```

And serve up a with gulp.

```sh
$ gulp serve
```

Type in the url bar:

```
http://localhost:5050
```

## Production run

With gulp:

```sh
$ gulp serve:dist
```

For the production deployment you need a static content server .
Copy the dist folder of the gulp output into the production environment and start the server. 

Don't forget updating a data folder when you have newer GTFS files.
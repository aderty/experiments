// angular.module is a global place for creating, registering and retrieving Angular modules
// 'listExample' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array or 'requires'
// 'listExample.services' is found in services.js
// 'listExample.controllers' is found in controllers.js
angular.module('listExample', ['ionic', 'listExample.services', 'listExample.controllers'])

.config(function ($stateProvider, $urlRouterProvider) {

    // Set up the initial routes that our app will respond to.
    // These are then tied up to our nav router which animates and
    // updates a navigation bar
    $stateProvider
      .state('movieIndex', {
          url: '/',
          templateUrl: '/index.html',
          controller: 'MovieIndexCtrl'
      })

      // if the url matches something like /movie/88 then this route
      // will fire off the MovieDetailCtrl (controllers.js)
      .state('movieDetail', {
          url: '/movie/:movieId',
          templateUrl: '/movie.html',
          controller: 'MovieDetailCtrl'
      });

    // if none of the above routes are met, use this fallback
    $urlRouterProvider.otherwise('/');

});

angular.module('listExample.services', [])

/**
 * A simple example service that returns some data.
 */
.factory('MovieService', function () {
    // Might use a resource here that returns a JSON array

    // Some fake testing data
    var movies = [
      {
          id: 'tt0080487',
          title: 'Caddyshack',
          released: '1980',
          description: 'An exclusive golf course has to deal with a brash new member and a destructive dancing gopher.',
          director: 'Harold Ramis',
          rating: 7.2
      },
      {
          id: 'tt0087332',
          title: 'Ghostbusters',
          released: '1984',
          description: 'Three unemployed parapsychology professors set up shop as a unique ghost removal service.',
          director: 'Ivan Reitman',
          rating: 7.8
      },
      {
          id: 'tt0097428',
          title: 'Ghostbusters II',
          released: '1989',
          description: 'The discovery of a massive river of ectoplasm and a resurgence of spectral activity allows the staff of Ghostbusters to revive the business.',
          director: 'Ivan Reitman',
          rating: 6.4
      },
      {
          id: 'tt0107048',
          title: 'Groundhog Day',
          released: '1993',
          description: 'A weatherman finds himself living the same day over and over again.',
          director: 'Harold Ramis',
          rating: 8.1
      },
      {
          id: 'tt0116778',
          title: 'Kingpin',
          released: '1996',
          description: 'A star bowler whose career was prematurely "cut off" hopes to ride a new prodigy to success and riches.',
          director: 'Bobby Farrelly, Peter Farrelly',
          rating: 6.8
      },
      {
          id: 'tt0335266',
          title: 'Lost in Translation',
          released: '2003',
          description: 'A faded movie star and a neglected young wife form an unlikely bond after crossing paths in Tokyo.',
          director: 'Sofia Coppola',
          rating: 7.8
      },
      {
          id: 'tt0079540',
          title: 'Meatballs',
          released: '1979',
          description: 'Wacky hijinks of counselors and campers at a less-than-average summer camp.',
          director: 'Ivan Reitman',
          rating: 5.9
      },
      {
          id: 'tt0128445',
          title: 'Rushmore',
          released: '1998',
          description: 'The king of Rushmore prep school is put on academic probation.',
          director: 'Wes Anderson',
          rating: 7.7
      },
      {
          id: 'tt0096061',
          title: 'Scrooged',
          released: '1988',
          description: 'A cynically selfish TV executive gets haunted by three spirits bearing lessons on Christmas Eve.',
          director: 'Richard Donner',
          rating: 6.9
      },
      {
          id: 'tt0083131',
          title: 'Stripes',
          released: '1981',
          description: 'Two friends who are dissatisfied with their jobs decide to join the army for a bit of fun.',
          director: 'Ivan Reitman',
          rating: 6.8
      },
      {
          id: 'tt0362270',
          title: 'The Life Aquatic with Steve Zissou',
          released: '2004',
          description: 'With a plan to exact revenge on a mythical shark that killed his partner, oceanographer Steve Zissou rallies a crew that includes his estranged wife, a journalist, and a man who may or may not be his son.',
          director: 'Wes Anderson',
          rating: 7.2
      },
      {
          id: 'tt0120483',
          title: 'The Man Who Knew Too Little',
          released: '1997',
          description: 'Murray is mistaken for a spy and must stop a plot to assasinate international leaders at a banquet.',
          director: 'Jon Amiel',
          rating: 6.4
      },
      {
          id: 'tt0265666',
          title: 'The Royal Tenenbaums',
          released: '2001',
          description: 'An estranged family of former child prodigies reunites when one of their member announces he has a terminal illness.',
          director: 'Wes Anderson',
          rating: 7.5
      },
      {
          id: 'tt0103241',
          title: 'What About Bob?',
          released: '1991',
          description: 'A successful psychiatrist loses his mind after one of his most dependent patients, a highly manipulative obsessive-compulsive, tracks him down during his family vacation.',
          director: 'Frank Oz',
          rating: 6.8
      },
      {
          id: 'tt1156398',
          title: 'Zombieland',
          released: '2009',
          description: 'A shy student trying to reach his family in Ohio, and a gun-toting tough guy trying to find the Last Twinkie and a pair of sisters trying to get to an amusement park join forces to travel across a zombie-filled America.',
          director: 'Ruben Fleischer',
          rating: 7.7
      }
    ];

    return {
        all: function () {
            return movies;
        },
        get: function (movieId) {
            // Simple index lookup
            for (var i = 0, l = movies.length; i < l; i++) {
                if (movies[i].id == movieId) {
                    return movies[i];
                }
            }
        }
    }
});

angular.module('listExample.controllers', [])


// Controller that fetches a list of data
.controller('MovieIndexCtrl', function ($scope, MovieService, $timeout) {

    // "MovieService" is a service returning mock data (services.js)
    // the returned data from the service is placed into this 
    // controller's scope so the template can render the data
    $scope.movies = MovieService.all();

    $scope.title = "Completely Random Collection Of Movies";

    // Method called on infinite scroll
    // Receives a "done" callback to inform the infinite scroll that we are done
    $scope.loadMore = function (done) {
        $timeout(function () {
            $scope.movies.push({
                id: 'tt0114814',
                title: 'Usual Suspects',
                released: '1995',
                description: 'A boat has been destroyed, criminals are dead, and the key to this mystery lies with the only survivor and his twisted, convoluted story beginning with five career crooks in a seemingly random police lineup.',
                director: 'Bryan Singer',
                rating: 8.3
            });
            $scope.movies.push({
                id: 'tt0357413',
                title: 'Anchorman: The Legend of Ron Burgundy',
                released: '2004',
                description: "Ron Burgundy is San Diego's top rated newsman in the male-dominated broadcasting of the 70's, but that's all about to change for Ron and his cronies when an ambitious woman is hired as a new anchor.",
                director: 'Adam McKay',
                rating: 7.2
            });
            $scope.movies.push({
                id: 'tt0058331',
                title: 'Mary Poppins',
                released: '1964',
                description: "A magic nanny comes to work for a cold banker's unhappy family.",
                director: 'Robert Stevenson',
                rating: 7.7
            });
            done();
        }, 1000);
    }
})

// Controller that shows more detailed info about a movie
.controller('MovieDetailCtrl', function ($scope, $stateParams, MovieService) {
    // "MovieService" is a service returning mock data (services.js)
    $scope.movie = MovieService.get($stateParams.movieId);
    $scope.title = "Movie Info";
});
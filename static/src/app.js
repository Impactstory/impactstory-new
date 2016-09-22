angular.module('app', [

    // external libs
    'ngRoute',
    'ngMessages',
    'ngCookies',
    'satellizer',

    'ngResource',
    'ngSanitize',
    'ngMaterial',

    // this is how it accesses the cached templates in ti.js
    'templates.app',

    // services
    'currentUser',
    'auth',
    'badgeDefs',
    'numFormat',
    'person',

    // pages
    'staticPages',
    'productPage', // MUST be above personPage because personPage route is greedy for /p/
    'personPage',
    'settingsPage',
    'wizard',
    'aboutPages'

]);




angular.module('app').config(function ($routeProvider,
                                       $mdThemingProvider,
                                       $locationProvider) {


    $locationProvider.html5Mode(true);

    // handle 404s.
    $routeProvider.otherwise({ redirectTo: 'page-not-found' })

    $mdThemingProvider.theme('default')
        .primaryPalette('deep-orange')
        .accentPalette("blue")



});


angular.module('app').run(function($route,
                                   $rootScope,
                                   $q,
                                   $timeout,
                                   $cookies,
                                   $http,
                                   $location,
                                   CurrentUser,
                                   Person) {


    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-23384030-1', 'auto');

    // if the user is logged in, get the most up-to-date token
    CurrentUser.boot()






    $rootScope.$on('$routeChangeStart', function(next, current){
    })
    $rootScope.$on('$routeChangeSuccess', function(next, current){
        window.scrollTo(0, 0)
        ga('send', 'pageview', { page: $location.url() });
        window.Intercom('update')

    })



    $rootScope.sendCurrentUserToIntercom = function(){
        // needs refactoring!

        // return false here if the user is not logged in


        // no idea if this will still work with CurrentUser approach
        $http.get("api/person/" + CurrentUser.d.orcid_id)
            .success(function(resp){
                $rootScope.sendToIntercom(resp)
                console.log("sending current user to intercom")
            })
    }

    $rootScope.sendToIntercom = function(personResp){
        var resp = personResp
        var percentOA = resp.percent_fulltext
        if (percentOA === null) {
            percentOA = undefined
        }
        else {
            percentOA * 100
        }

        var intercomInfo = {
            // basic user metadata
            app_id: "z93rnxrs",
            name: resp._full_name,
            user_id: resp.orcid_id, // orcid ID
            claimed_at: moment(resp.claimed_at).unix(),
            email: resp.email,

            // user stuff for analytics
            percent_oa: percentOA,
            num_posts: resp.num_posts,
            num_mentions: resp.num_mentions,
            num_products: resp.products.length,
            num_badges: resp.badges.length,
            num_twitter_followers: resp.num_twitter_followers,
            campaign: resp.campaign,
            fresh_orcid: resp.fresh_orcid,

            // we don't send person responses for deleted users (just 404s).
            // so if we have a person response, this user isn't deleted.
            // useful for when users deleted profile, then re-created later.
            is_deleted: false

        }

        // this it temporary till we do the twitter-based signup
        if ($cookies.get("sawOpenconLandingPage")) {
            intercomInfo.saw_opencon_landing_page = true
        }


        console.log("sending to intercom", intercomInfo)

        window.Intercom("boot", intercomInfo)
    }

    $rootScope.sendCurrentUserToIntercom()
    








    $rootScope.$on('$routeChangeError', function(event, current, previous, rejection){
        console.log("$routeChangeError! here's some things to look at: ", event, current, previous, rejection)

        $rootScope.setPersonIsLoading(false)
        $location.url("page-not-found")
        window.scrollTo(0, 0)
    });




});





angular.module('app').controller('AppCtrl', function(
    $rootScope,
    $scope,
    $route,
    $location,
    NumFormat,
    $interval,
    $http,
    CurrentUser,
    $mdDialog,
    $auth, // todo remove
    $sce){

    $scope.auth = $auth  // todo remove
    $scope.currentUser = CurrentUser
    $scope.numFormat = NumFormat
    $scope.moment = moment // this will break unless moment.js loads over network...






    $scope.global = {}

    $rootScope.setPersonIsLoading = function(isLoading){
        $scope.global.personIsLoading = !!isLoading
    }


    $scope.pageTitle = function(){
        if (!$scope.global.title){
            $scope.global.title = "Discover the online impact of your research"
        }
        return "Impactstory: " + $scope.global.title
    }


    $rootScope.$on('$routeChangeSuccess', function(next, current){
        $scope.global.showBottomStuff = true
        $scope.global.loggingIn = false
        $scope.global.title = null
        $scope.global.isLandingPage = false
        $location.search("source", null)
    })

    $scope.trustHtml = function(str){
        return $sce.trustAsHtml(str)
    }
    $scope.pluralize = function(noun, number){
        //pluralize.addSingularRule(/slides$/i, 'slide deck')
        return pluralize(noun, number)
    }



    // config stuff
    // badge group configs
    var badgeGroupIcons = {
        engagement: "user",
        openness: "unlock-alt",
        buzz: "bullhorn",
        fun: "smile-o"
    }
    $scope.getBadgeIcon = function(group){
        if (badgeGroupIcons[group]){
            return badgeGroupIcons[group]
        }
        else {
            return "fa-trophy"
        }
    }

    
    // genre config
    var genreIcons = {
        'article': "file-text-o",
        'blog': "comments",
        'dataset': "table",
        'figure': "bar-chart",
        'image': "picture-o",
        'poster': "map-o",
        'conference-poster': "map-o",
        'slides': "desktop",
        'software': "save",
        'twitter': "twitter",
        'video': "facetime-video",
        'webpage': "laptop",
        'online-resource': "desktop",
        'preprint': "paper-plane-o",
        'other': "ellipsis-h",
        'unknown': "file-o",
        "conference-paper": "list-alt",  // conference proceeding
        "book": "book",
        "book-chapter": "bookmark-o",  // chapter anthology
        "thesis": "graduation-cap",
        "dissertation": "graduation-cap",
        "peer-review": "comments-o"
    }
    $scope.getGenreIcon = function(genre){
        if (genreIcons[genre]){
            return genreIcons[genre]
        }
        else {
            return genreIcons.unknown
        }
    }



    var showAlert = function(msgText, titleText, okText){
        if (!okText){
            okText = "ok"
        }
          $mdDialog.show(
                  $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title(titleText)
                    .textContent(msgText)
                    .ok(okText)
            );
    }
    $rootScope.showAlert = showAlert









    /********************************************************
     *
     *  stripe stuff
     *
    ********************************************************/



    var stripeInfo = {
        email: null,
        tokenId: null,
        cents: 0,

        // optional
        fullName: null,
        orcidId: null
    }

    var stripeHandler = StripeCheckout.configure({
        key: stripePublishableKey,
        locale: 'auto',
        token: function(token) {
            stripeInfo.email = token.email
            stripeInfo.tokenId = token.id

            console.log("now we are doing things with the user's info", stripeInfo)
            $http.post("/api/donation", stripeInfo)
                .success(function(resp){
                    console.log("the credit card charge worked!", resp)
                    showAlert(
                        "We appreciate your donation, and we've emailed you a receipt.",
                        "Thanks so much!"
                    )
                })
                .error(function(resp){
                    console.log("error!", resp.message)
                    if (resp.message){
                        var reason = resp.message
                    }
                    else {
                        var reason = "Sorry, we had a server error! Drop us a line at team@impactstory.org and we'll fix it."
                    }
                    showAlert(reason, "Credit card error")
                })
        }
      });
    $scope.donate = function(cents){
        console.log("donate", cents)
        stripeInfo.cents = cents
        if (CurrentUser.isLoggedIn()){
            stripeInfo.fullName = CurrentUser.d.given_names + " " + CurrentUser.d.family_name
            stripeInfo.orcidId = CurrentUser.d.orcid_id
        }

        stripeHandler.open({
          name: 'Impactstory donation',
          description: "We're a US 501(c)3",
          amount: cents
        });
    }


})



.controller('badgeItemCtrl', function($scope){
    $scope.showMaxItems = 3
    $scope.getIconUrl = function(name){
    }
})

.controller('tweetRollupCtrl', function($scope){
    $scope.showTweets = false
})

.controller('mendeleyRollupCtrl', function($scope){
    $scope.showMendeley = false
})
    
.directive('subscorehelp', function(){
        return {
            restrict: "E",
            templateUrl: 'helps.tpl.html',
            scope:{
                subscoreName: "=name"
            },
            link: function(scope, elem, attrs){
            }
        }
    })

.directive('short', function(){
        return {
            restrict: "E",
            template: '{{shortText}}<span ng-show="shortened">&hellip;</span>',
            scope:{
                text: "=text",
                len: "=len"
            },
            link: function(scope, elem, attrs){

                var newLen
                if (scope.len) {
                    newLen = scope.len
                }
                else {
                    newLen = 40
                }
                if (scope.text.length > newLen){
                    var short = scope.text.substring(0, newLen)
                    short = short.split(" ").slice(0, -1).join(" ")
                    scope.shortText = short
                    scope.shortened = true
                }
                else {
                    scope.shortText = scope.text
                }

            }
        }
    })















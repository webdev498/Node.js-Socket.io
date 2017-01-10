
/*
 * Module dependencies
 */

var passport = require('passport')
  , utils = require('../utils');

/**
 * Expose routes
 */

module.exports = Routes;

/**
 * Defines routes for application
 *
 * @param {Express} app `Express` instance.
 * @api public
 */

function Routes (app) {
  var config = app.get('config');
  var client = app.get('redisClient');
  
  /*
   * Homepage
   */

  app.get('/', function(req, res, next) {
    if(req.isAuthenticated()){
      client.hmset(
          'users:' + req.user.provider + ":" + req.user.username
        , req.user
      );
      res.redirect('/rooms');
    } else{
      res.render('index');
    }
  });

  /*
   * Authentication routes
   */

  if(config.auth.twitter.consumerkey.length) {
    app.get('/auth/twitter', passport.authenticate('twitter'));

    app.get('/auth/twitter/callback', 
      passport.authenticate('twitter', {
        successRedirect: '/',
        failureRedirect: '/'
      })
    );
  }

  if(config.auth.facebook.clientid.length) {
    app.get('/auth/facebook', passport.authenticate('facebook'));

    app.get('/auth/facebook/callback', 
      passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/'
      })
    );
  }

  if(config.auth.github.clientid.length) {
    app.get('/auth/github', passport.authenticate('github'));

    app.get('/auth/github/callback', 
      passport.authenticate('github', {
        successRedirect: '/',
        failureRedirect: '/'
      })
    );
  }

  app.get('/auth/steam',
    passport.authenticate('steam'),
    function(req, res) {
      // The request will be redirected to Steam for authentication, so
      // this function will not be called.
    });

  app.get('/auth/steam/return',
    passport.authenticate('steam', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    });

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  /*
   * Rooms list
   */

  app.get('/rooms', utils.restrict, function(req, res) {
    utils.getPublicRoomsInfo(client, function(rooms) {
      res.render('room_list', { rooms: rooms });                   
    });
  });

  /*
   * Create a rooom
   */

  app.post('/create', utils.restrict, function(req, res) {
    utils.validRoomName(req, res, function(roomKey) {
      utils.roomExists(req, res, client, function() {
        utils.createRoom(req, res, client);
      });
    });
  });

  /*
   * Join a room
   */

  app.get('/:id', utils.restrict, function(req, res) {
    utils.getRoomInfo(req, res, client, function(room) {
      utils.getUsersInRoom(req, res, client, room, function(users) {
        utils.getPublicRoomsInfo(client, function(rooms) {
          utils.getUserStatus(req.user, client, function(status) {
            utils.enterRoom(req, res, room, users, rooms, status);
          });
        });
      });
    });
  });

}

var socket = require('socket.io');

var io;

module.exports = {
  init: function(server) {
    io = socket(server);
    return io;
  },
  getIO: function() {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
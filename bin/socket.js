var socket = require('socket.io');

var io;

module.exports = {
  init: function(server) {
    io = socket(server, {
      cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
      }
    });
    return io;
  },
  getIO: function() {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
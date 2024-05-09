var express = require('express');
var router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../funcs/logger');




const localstorage = multer.diskStorage({
    destination: function(req, file, cb) {
      const dir = './uploads/' + req.body.username;
      console.log(req.body.author);
      try {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Directory ${dir} created successfully`);
      } catch (error) {
        logger.error(`Error creating directory ${dir}: ${error}`);
      }
      cb(null, dir); // Destination folder
    },
    filename: function(req, file, cb) {
      const filename = req.body.author + '-' + Date.now() + path.extname(file.originalname);
      logger.info(`File to be uploaded: ${filename}`);
      cb(null, filename); // Naming the file
    }
  });
  
const upload = multer({ 
    storage: localstorage,
    limits: { fileSize: 10000000 }  // 10MB
  });

router.post('/', upload.single('mp3File'), (req, res) => {
    if (req.file) {
      logger.info(`File ${req.file.filename} uploaded successfully`);
      res.send('File uploaded successfully');
    } else {
      const message = 'Error uploading file';
      logger.error(message);
      res.status(500).send(message);
    }
  });

module.exports = router;
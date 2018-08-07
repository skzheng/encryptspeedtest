const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()
const crypto = require('crypto');
const http = require('http');
const request = require('request');

const KEY = 'TEST'
const cipher = crypto.createCipher('aes-256-ctr', KEY);
const decipher = crypto.createDecipher('aes-256-ctr', KEY);

const S3KEY = '1fd092fcf11bb6b785c89b2541048d49b3ac6bb3ddb3fe75780dba17c3e5cd3d56aad00cce84eb23c9b9401b84930775';
// const s3cipher = crypto.createCipher('aes-256-ctr', S3KEY);
const s3decipher = crypto.createDecipher('aes-256-cbc', S3KEY);

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/index.html'))
})

app.get('/decrypted', function(req, res) {
  const path = 'assets/sample.mp4';
  const stat =fs.statSync(path);
  const fileSize = stat.size;
  const range = req.headers.range; 

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] 
      ? parseInt(parts[1], 10)
      : fileSize - 1;
    
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(path, {start, end});
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4'
    }
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4'
    }
    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res);
  }
});

app.get('/encrypted', function(req, res) {
  const path = 'assets/sample.mp4';
  const stat = fs.statSync(path);
  const fileSize = stat.size;
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10);
    const end = parts[1]
    ? parseInt(parts[1], 10)
    : fileSize - 1;
    
    const chunksize = (end-start)+1
    const file = fs.createReadStream(path, {start, end})
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    }

    res.writeHead(206, head);
    file.pipe(res).pipe(cipher).pipe(decipher);
    // file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res).pipe(cipher).pipe(decipher);
    // fs.createReadStream(path).pipe(res);
  }
});

// app.get('/s3encrypted', function(req, res) {
//   // let file = fs.createWriteStream("efile.mp4");

//   let input = fs.createReadStream
//   let bufferStream = new stream.PassThrough();

//   let request = http.get("http://s3.amazonaws.com/prototype.sesamecms.org/large-video/test.mp4 ", function(response) {
//     response.pipe(res)
//     // let decrypted = decrypt(response);
//     // decrypted.pipe(res);
//     // let vid = response.pipe(file);
//     // vid.on('finish', function() {
//     //   fs.createReadStream("efile.mp4").pipe(res).pipe(s3decipher);
//     // });
//     input.pipe(s3decipher).pipe(bufferStream, { end: true });
    
//     bufferStream.on('readable', () => {
//       let chunk = bufferStream.read(16 * 1024);
//       if (chunk) {
//         if ((start - length >= 0) && (start - length < 16 * 1024)) {
//           dataReady = true;
//         }
//         length += chunk.length;
//         if (dataReady) {
//           res.statusCode = 206;
//           res.write(chunk);
//         }
//       }
//     });
//     bufferStream.on('end', () => {
//       res.end();
//     });
//   });
//   // function decrypt(buff) {
//   //   return Buffer.concat([
//   //     s3decipher.update(buff),
//   //     s3decipher.final()
//   //   ]).toString();
//   // }
// });

app.get('/s3encrypted', function(req, res) {
  // let file = fs.createWriteStream("file.mp4");
  // let request = http.get("http://s3.amazonaws.com/prototype.sesamecms.org/large-video/test-e.mp4", function(response) {
    
  //   // let decoded = decipher.update(response, 'binary', 'utf8');
  //   // decoded += decipher.final('utf8');

  //   // decoded.pipe(res);
  //   // let vid = response.pipe(file);
  //   // vid.on('finish', function () {
  //   //   fs.createReadStream("file.mp4").pipe(res);
  //   // });
  // });
  request.get("http://s3.amazonaws.com/prototype.sesamecms.org/large-video/test-e.mp4").pipe(s3decipher).pipe(res);
});
app.get('/s3decrypted', function(req, res) {
  // let request = http.get("http://s3.amazonaws.com/prototype.sesamecms.org/large-video/test.mp4", function(response) {
  // //   // console.log(response);
  //   response.pipe(res);
  // });
  request.get("http://s3.amazonaws.com/prototype.sesamecms.org/large-video/test.mp4").pipe(res);
});

app.listen(3000, function () {
  console.log('Listening on port 3000!')
})
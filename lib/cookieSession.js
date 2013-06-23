var crypto = require('crypto');

// This connect middleware roundtrips session state as an encrypted cookie

module.exports = function (secret) {
  return function(req, res, next) {
    var encrypted = req.signedCookies['w3_sid'];
    if (encrypted) {
      try {
        var c = crypto.createDecipher('aes192', secret);
        var plaintext = c.update(encrypted, 'base64', 'utf8') + c.final('utf8');
        req.session = JSON.parse(plaintext);
      }
      catch (e) {
        req.session = {};
      }
    }
    else {
      req.session = {};
    }

    req.session.save = function (callback) { callback(); };
    var oldWriteHead = res.writeHead;
    res.writeHead = function (status, headers) {
      delete req.session.save;
      var c = crypto.createCipher('aes192', secret);
      var ciphertext = c.update(JSON.stringify(req.session), 'utf8', 'base64') + c.final('base64');
      res.cookie('w3_sid', ciphertext, { signed: true });
      res.writeHead = oldWriteHead;
      return res.writeHead(status, headers);
    };

    next();
  }
}
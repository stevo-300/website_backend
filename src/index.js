const Fastify = require("fastify");
const Mongoose = require("mongoose");
const { compareAsc, addMinutes } = require("date-fns");
const MONGO_URI = "mongodb://localhost:27017/dreamspace";

function build(opts) {
  const fastify = Fastify(opts);

  fastify
    .register(require("fastify-jwt"), {
      secret: "superdupersecretsquirrel...booya"
    })
    .register(require("fastify-leveldb"), { name: "authdb-async" })
    .register(require("fastify-auth"))
    .register(require("fastify-cors"), { origin: true })
    .after(routes);

  fastify.decorate(
    "MongoDB",
    Mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
  );
  fastify.decorate("tokenWhitelist", []);
  fastify.decorate("verifyJWTandLevel", verifyJWTandLevel);
  fastify.decorate("verifyUserAndPassword", verifyUserAndPassword);

  function verifyJWTandLevel(request, reply) {
    const jwt = this.jwt;
    const level = this.level;

    if (request.body && request.body.failureWithReply) {
      reply.code(401).send({ error: "Unauthorized" });
      return Promise.reject(new Error());
    }

    if (!request.req.headers.auth) {
      return Promise.reject(new Error("Missing token header"));
    }

    return new Promise(function(resolve, reject) {
      jwt.verify(request.req.headers.auth, function(err, decoded) {
        if (err) {
          return reject(err);
        }
        let t = tokenSearch(request.req.headers.auth);
        if (t != undefined) {
          if (!t.Expired) {
            if (t.NeedsRenewing) {
              renewToken(t.token);
            }
            resolve(decoded);
          } else {
            removeExpiredToken(t.token);
            return reject(new Error("Token Expired"));
          }
        } else {
          return reject(new Error("Unathorised"));
        }
      });
    })
      .then(function(decoded) {
        return level.get(decoded.user).then(function(password) {
          if (!password || password !== decoded.password) {
            throw new Error("Token not valid level");
          }
        });
      })
      .catch(function(error) {
        request.log.error(error);
        throw new Error("General Error");
      });
  }

  function verifyUserAndPassword(request, reply, done) {
    const level = this.level;

    level.get(request.body.user, onUser);

    function onUser(err, password) {
      if (err) {
        if (err.notFound) {
          return done(new Error("Password not valid"));
        }
        return done(err);
      }

      if (!password || password !== request.body.password) {
        return done(new Error("Password not valid"));
      }

      done();
    }
  }

  function routes() {
    fastify.register(require("./routes/authentication"));
    fastify.register(require("./routes/general"));
    fastify.register(require("./routes/blog"));
    fastify.register(require("./routes/gaming"));
  }

  let tokenSearch = token => {
    let t = fastify.tokenWhitelist
      .filter(elem => elem.token === token)
      .map(obj => obj.token);
    let e = fastify.tokenWhitelist
      .filter(elem => elem.token === token)
      .map(obj => obj.Expires);
    return {
      token: t,
      Expires: e,
      NeedsRenewing: compareAsc(new Date(), e) < 0,
      Expired: compareAsc(new Date(), addMinutes(e, 15)) < 0
    };
  };

  let renewToken = token => {
    fastify.tokenWhitelist.forEach(elem => {
      if (elem.token === token) {
        elem.Expires = addMinutes(new Date(), 15);
      }
    });
  };

  let removeExpiredToken = token => {
    for (let i = 0; i < fastify.tokenWhitelist.length; i++) {
      if (fastify.tokenWhitelist[i].token === token) {
        fastify.tokenWhitelist.splice(i,1);
      }
    }
  }

  let removexpiredTokens = () => {
    fastify.tokenWhitelist = fastify.tokenWhitelist.filter(elem => compareAsc(new Date(), addMinutes(elem.token, 15)) > 0)
  }

  return fastify;
}

//if (require.main === module) {
const fastify = build({
  logger: {
    level: "info"
  }
});
fastify.listen(4000, err => {
  if (err) throw err;
  console.log(
    `Server listenting at http://localhost:${fastify.server.address().port}`
  );
});
//}

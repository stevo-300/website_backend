const Fastify = require("fastify");
const MONGO_URI = "mongodb://localhost:27017/dreamspace";

function build(opts) {
  const fastify = Fastify(opts);

  // fastify.use(require(cors)())

  // fastify
  fastify
    .register(require("fastify-jwt"), { secret: "supersecret" })
    .register(require("fastify-leveldb"), { name: "authdb-async" })
    .register(require("fastify-auth"))
    .register(require("fastify-cors"), {origin: true})
    .after(routes);

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
        resolve(decoded);
      });
    })
      .then(function(decoded) {
        return level.get(decoded.user).then(function(password) {
          if (!password || password !== decoded.password) {
            throw new Error("Token not valid");
          }
        });
      })
      .catch(function(error) {
        request.log.error(error);
        throw new Error("Token not valid");
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

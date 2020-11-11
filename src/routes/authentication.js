let testStore = [];
const { addMinutes } = require("date-fns");

let routes = async (fastify, options) => {
  // fastify.get('/signup', async function (req, res) {
  //     const token = fastify.jwt.sign({payload})
  //     reply.send({token})
  // })

  fastify.route({
    method: "POST",
    url: "/register",
    schema: {
      body: {
        type: "object",
        properties: {
          user: { type: "string" },
          password: { type: "string" }
        },
        required: ["user", "password"]
      }
    },
    handler: (req, reply) => {
      req.log.info("Creating new user");
      fastify.level.put(req.body.user, req.body.password, onPut);

      function onPut(err) {
        if (err) return reply.send(err);
        fastify.jwt.sign(req.body, onToken);
      }

      function onToken(err, token) {
        if (err) return reply.send(err);
        req.log.info("User created");
        fastify.tokenWhitelist.push(token);
        reply.send({ token });
      }
    }
  });

  fastify.route({
    method: "POST",
    url: "/login",
    schema: {
      body: {
        type: "object",
        properties: {
          user: { type: "string" },
          password: { type: "string" }
        },
        required: ["user", "password"]
      }
    },
    handler: (req, reply) => {
      req.log.info("Logging in user");
      fastify.level.get(req.body.user, onUser);

      function onUser(err, password) {
        if (err) {
          if (err.notFound) {
            // prettier-ignore
            reply.send({
              "Error": "Password not Found",
              "ErrorCode": "501"
            });
          }
          // prettier-ignore
          reply.send({
            "Error": "Password Error",
            "ErrorCode": "500"
          });
        }

        if (!password || password !== req.body.password) {
          // prettier-ignore
          reply.send({
            "Error": "Password not Valid",
            "ErrorCode": "502"
          });
        }
        // prettier-ignore
        onPut();
      }

      function onPut(err) {
        if (err) return reply.send(err);
        fastify.jwt.sign(req.body, onToken);
      }

      function onToken(err, token) {
        if (err) return reply.send(err);
        req.log.info(fastify.tokenWhitelist);
        addUserToken(token, fastify.tokenWhitelist);
        reply.send({
          token,
          profile: getUserProfile(req.body.user)
        });
      }
    }
  });

  fastify.route({
    method: "GET",
    url: "/logout",
    handler: (req, reply) => {
      if (req.headers.auth) {
        removeUserToken(req.headers.auth, fastify.tokenWhitelist);
      }
      // prettier-ignore
      reply.send({
        "Message": "User Logged Out"
      });
    }
  });

  fastify.route({
    method: "GET",
    url: "/no-auth",
    handler: (req, reply) => {
      req.log.info("Auth free route");
      reply.send({ hello: "world" });
    }
  });

  fastify.route({
    method: "GET",
    url: "/auth",
    preHandler: fastify.auth([fastify.verifyJWTandLevel]),
    handler: (req, reply) => {
      req.log.info("Auth route");
      reply.send({ hello: "world" });
    }
  });
};

let getUserProfile = username => {
  let profileData = {
    Name: "Steve Watson",
    username
  };
  return profileData;
};

let setUserProfile = (username, profile) => {};

// prettier-ignore
let addUserToken = (tokenSting, store) => {
  let t = {
    token: tokenSting,
    Expires: addMinutes(new Date(),15)
  }
  store.push(t)
};
let removeUserToken = (token, store) => {
  for (let i = 0; i < store.length; i++) {
    if (store[i]["token"] === token) {
      store.splice(i, 1);
    }
  }
};

module.exports = routes;

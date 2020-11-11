const fastify = require("fastify")();

fastify.register(require("fastify-cors"), {
  // put your options here
});

fastify.get("/", (req, reply) => {
  reply.send({ hello: "world" });
});

fastify.listen(4000);

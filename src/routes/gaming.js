const Backlog = require("../models/gaming/backlog");

let routes = async (fastify, options) => {
  fastify.route({
    method: "GET",
    url: "/getBacklog",
    handler: async (req, reply) => {
      try {
        let result = await Backlog.find({
          completed: false,
          cancelled: false
        }).exec();
        reply.send({ result: "Success", item: result, other: "boom" });
      } catch (error) {
        reply.send({ result: "Error", item: error, other: "moob" });
      }
    }
  });

  fastify.route({
    method: "POST",
    url: "/addBacklog",
    handler: async (req, reply) => {
      try {
        let newItem = new Backlog(req.body);
        let result = await newItem.save();
        reply.send({ result: "Success", item: result });
      } catch (error) {
        reply.send({ result: "Error", Error: error });
      }
    }
  });

  fastify.route({
    method: "POST",
    url: "/updateBacklog",
    handler: async (req, reply) => {
      try {
        let result = await Backlog.findByIdAndUpdate(
          req.body.ID,
          { $set: req.body.Item },
          { new: true }
        ).exec();
        reply.send({ result: "Success", item: result });
      } catch (error) {
        reply.send({ result: "Error", Error: error });
      }
    }
  });

  fastify.route({
    method: "DELETE",
    url: "/deleteBacklog",
    handler: async (req, reply) => {
      try {
        let result = await Backlog.findOneAndDelete({
          _id: req.body.ID
        }).exec();
        reply.send({ result: "Success" });
      } catch (error) {
        reply.send({ result: "Error", Error: error });
      }
    }
  });
};

module.exports = routes;

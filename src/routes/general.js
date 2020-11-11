let routes = async (fastify, options) => {
    fastify.get('/', (req, res) => {
        // req.log.info(res.header)
        res.send({'hello': 'world'})
    })
}

module.exports = routes
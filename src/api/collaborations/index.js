const CollaborationsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'collaborations',
  version: '1.0.0',
  register: async (server, { service, validator, playlistsService }) => {
    const collaborationsHandler = new CollaborationsHandler(
      service, validator, playlistsService,
    );
    server.route(routes(collaborationsHandler));
  },
};

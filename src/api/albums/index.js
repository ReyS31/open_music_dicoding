const Albums = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, {
    service, validator, songsService, storageService, albumLikesService,
  }) => {
    const albumsHandler = new Albums(
      service, validator, songsService, storageService, albumLikesService,
    );
    server.route(routes(albumsHandler));
  },
};

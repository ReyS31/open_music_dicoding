const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(service, validator, songsService, storageService, albumLikesService) {
    this._service = service;
    this._validator = validator;
    this._songsService = songsService;
    this._storageService = storageService;
    this._albumLikesService = albumLikesService;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    let album = await this._service.getAlbumById(id);
    const songs = await this._songsService.getSongsByAlbumId(id);
    album = { ...album, songs };
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async putAlbumCoverByIdHandler(request, h) {
    const { cover } = request.payload;
    this._validator.validateImageHeaders(cover.hapi.headers);
    const { id } = request.params;

    await this._service.getAlbumById(id);
    const fileLocation = await this._storageService.writeFile(cover, cover.hapi);

    await this._service.editAlbumCover(id, {
      cover: fileLocation,
    });

    const response = h.response({
      status: 'success',
      mesasge: 'cover berhasil diganti',
      data: {
        fileLocation,
      },
    });
    response.code(201);
    return response;
  }

  async postAlbumLikeByIdHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { id: albumId } = request.params;

    await this._service.getAlbumById(albumId);
    await this._albumLikesService.addAlbumLike({
      userId,
      albumId,
    });

    const response = h.response({
      status: 'success',
      message: 'menyukai album',
    });
    response.code(201);
    return response;
  }

  async getAlbumLikeByIdHandler(request, h) {
    const { id } = request.params;

    const { cache, data } = await this._albumLikesService.getAlbumLikes(id);

    const response = h.response({
      status: 'success',
      data,
    }).header('X-Data-Source', cache ? 'cache' : 'no-cache');
    return response;
  }

  async deleteAlbumLikeByIdHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { id: albumId } = request.params;

    await this._albumLikesService.deleteAlbumLike({
      userId,
      albumId,
    });
    const response = h.response({
      status: 'success',
      message: 'batal menyukai album',
    });
    return response;
  }
}

module.exports = AlbumsHandler;

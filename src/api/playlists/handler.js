const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(service, activitiesService, validator) {
    this._service = service;
    this._activitiesService = activitiesService;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);

    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this._service.addPlaylist(name, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan.',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;

    const playlists = await this._service.getPlaylistsByUser(credentialId);

    const response = h.response({
      status: 'success',
      message: 'Playlist Ditemukan.',
      data: {
        playlists,
      },
    });
    response.code(200);
    return response;
  }

  async deletePlaylistHandler(request, h) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.verifyPlaylistOwnerWithThrow(id, userId);
    await this._service.deletePlaylistById(id);

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil dihapus.',
    });
    response.code(200);
    return response;
  }

  async postPlaylistSongHandler(request, h) {
    this._validator.validatePlaylistAddSongPayload(request.payload);
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;
    const { songId } = request.payload;

    await this._service.verifyPlaylistAccess(id, userId);
    await this._service.addPlaylistSong(id, songId);
    await this._activitiesService.addActivities(
      id,
      songId,
      userId,
      'add',
    );

    const response = h.response({
      status: 'success',
      message: 'Lagu ditambahkan ke playlist.',
    });
    response.code(201);
    return response;
  }

  async getPlaylistSongsHandler(request, h) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(id, userId);
    let playlist = await this._service.getPlaylistById(id);
    const songs = await this._service.getPlaylistSongs(id);
    playlist = { ...playlist, songs };
    const response = h.response({
      status: 'success',
      message: 'Playlist Ditemukan.',
      data: {
        playlist,
      },
    });
    response.code(200);
    return response;
  }

  async deletePlaylistSongHandler(request, h) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    this._validator.validatePlaylistAddSongPayload(request.payload);
    const { songId } = request.payload;

    await this._service.verifyPlaylistAccess(id, userId);
    await this._service.deletePlaylistSongById(id, songId);
    await this._activitiesService.addActivities(
      id,
      songId,
      userId,
      'delete',
    );

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist.',
    });
    response.code(200);
    return response;
  }

  async getPlaylistSongActivities(request, h) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(id, userId);
    const activities = await this._activitiesService.getActivities(id);
    const response = h.response({
      status: 'success',
      message: 'Playlist Ditemukan.',
      data: {
        playlistId: id,
        activities,
      },
    });
    response.code(200);
    return response;
  }
}

module.exports = PlaylistsHandler;

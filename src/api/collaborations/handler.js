const autoBind = require('auto-bind');

class CollaborationsHandler {
  constructor(service, validator, playlistsService) {
    this._service = service;
    this._validator = validator;
    this._playlistsService = playlistsService;

    autoBind(this);
  }

  async postCollaborationHandler(request, h) {
    this._validator.validateCollaborationsPayload(request.payload);
    const { playlistId, userId } = request.payload;

    const { id: credentialId } = request.auth.credentials;
    await this._playlistsService.verifyPlaylistOwnerWithThrow(playlistId, credentialId);

    const collaborationId = await this._service.addCollaboration(playlistId, userId);

    const response = h.response({
      status: 'success',
      message: 'Collaborator berhasil ditambahkan',
      data: {
        collaborationId,
      },
    });
    response.code(201);
    return response;
  }

  async deleteCollaborationHandler(request, h) {
    this._validator.validateCollaborationsPayload(request.payload);
    const { playlistId, userId } = request.payload;

    const { id: credentialId } = request.auth.credentials;
    await this._playlistsService.verifyPlaylistOwnerWithThrow(playlistId, credentialId);
    await this._service.deleteCollaboration(playlistId, userId);

    const response = h.response({
      status: 'success',
      message: 'Collaborator berhasil dihapus',
    });
    response.code(200);
    return response;
  }
}

module.exports = CollaborationsHandler;

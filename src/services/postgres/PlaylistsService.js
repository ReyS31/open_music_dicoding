const { Pool } = require('pg');
const { nanoid } = require('nanoid');

const AuthorizationError = require('../../exceptions/AuthorizationError');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBToSong, mapDBToPlaylist } = require('../../utils');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist(name, owner) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylistsByUser(userId) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists
      LEFT JOIN users ON users.id = playlists.owner
      LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
      WHERE collaborations.user_id = $1 OR playlists.owner = $1`,
      values: [userId],
    };
    const result = await this._pool.query(query);

    return result.rows.map(mapDBToPlaylist);
  }

  async getPlaylistById(id) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists 
      LEFT JOIN users ON users.id = playlists.owner
      WHERE playlists.id = $1`,
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows.map(mapDBToPlaylist)[0];
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async addPlaylistSong(playlistId, songId) {
    const preQuery = {
      text: 'SELECT title FROM songs WHERE id = $1',
      values: [songId],
    };
    const preResult = await this._pool.query(preQuery);

    if (!preResult.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    const id = `playlist_song-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }

    return result.rows[0].id;
  }

  async getPlaylistSongs(id) {
    const query = {
      text: `SELECT songs.id, songs.title, songs.performer FROM songs
    LEFT JOIN playlist_songs ON playlist_songs.song_id = songs.id
    WHERE playlist_songs.playlist_id = $1`,
      values: [id],
    };
    const result = await this._pool.query(query);
    return result.rows.map(mapDBToSong);
  }

  async deletePlaylistSongById(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus dari playlist. Id tidak ditemukan');
    }
  }

  async verifyPlaylistOwner(playlistId, userId) {
    const query = {
      text: 'SELECT owner FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      return 'not found';
    }

    const note = result.rows[0];
    if (note.owner !== userId) {
      return 'forbidden';
    }

    return 'success';
  }

  async verifyPlaylistAccess(playlistId, userId) {
    const collaboratorAccess = await this._collaborationService.verifyCollaborator(
      playlistId, userId,
    );

    if (collaboratorAccess === 'not found') throw new NotFoundError('Playlist tidak ditemukan');

    const ownerAccess = await this.verifyPlaylistOwner(playlistId, userId);

    if (collaboratorAccess !== 'success' && ownerAccess !== 'success') {
      if (ownerAccess === 'forbidden') throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
      if (ownerAccess === 'not found') throw new NotFoundError('Playlist tidak ditemukan');
      if (collaboratorAccess === 'not verified') throw new InvariantError('Kolaborasi gagal diverifikasi');
    }
  }

  async verifyPlaylistOwnerWithThrow(playlistId, userId) {
    const ownerAccess = await this.verifyPlaylistOwner(playlistId, userId);

    if (ownerAccess === 'forbidden') throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    if (ownerAccess === 'not found') throw new NotFoundError('Playlist tidak ditemukan');
  }
}

module.exports = PlaylistsService;

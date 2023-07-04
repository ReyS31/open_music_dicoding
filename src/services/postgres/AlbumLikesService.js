const { Pool } = require('pg');
const { nanoid } = require('nanoid');

const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumLikesService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async isLiked(userId, albumId) {
    const query = {
      text: 'SELECT id FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (result.rows.length > 0) {
      throw new InvariantError('Album sudah disukai');
    }
  }

  async addAlbumLike({ userId, albumId }) {
    await this.isLiked(userId, albumId);
    const id = `like-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal disukai');
    }

    await this._cacheService.delete(`likes:${albumId}`);
  }

  async deleteAlbumLike({ userId, albumId }) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal tidak disukai. Id tidak ditemukan');
    }

    await this._cacheService.delete(`likes:${albumId}`);
  }

  async getAlbumLikes(albumId) {
    try {
      // mendapatkan catatan dari cache
      const result = await this._cacheService.get(`likes:${albumId}`);
      return { cache: true, data: JSON.parse(result) };
    } catch (error) {
      const query = {
        text: 'SELECT id FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);
      const mappedResult = {
        likes: result.rows.length,
      };

      await this._cacheService.set(
        `likes:${albumId}`,
        JSON.stringify(mappedResult),
      );
      return { cache: false, data: mappedResult };
    }
  }
}

module.exports = AlbumLikesService;

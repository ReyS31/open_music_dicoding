/* eslint-disable camelcase */
const mapDBToSong = ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  album_id,
}) => ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId: album_id,
});

const mapDBToPlaylist = ({
  id,
  name,
  username,
}) => ({
  id,
  name,
  username,
});

const mapDBToAlbum = ({
  id,
  name,
  year,
  cover,
  songs,
}) => ({
  id,
  name,
  year,
  coverUrl: cover,
  songs,
});

module.exports = { mapDBToSong, mapDBToPlaylist, mapDBToAlbum };

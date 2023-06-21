/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // memberikan constraint foreign key pada album terhadap kolom id dari tabel songs
  pgm.addConstraint(
    'songs',
    'fk_songs.album.id',
    'FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  // menghapus constraint fk_songs.album.id pada tabel songs
  pgm.dropConstraint('songs', 'fk_songs.album.id');
};

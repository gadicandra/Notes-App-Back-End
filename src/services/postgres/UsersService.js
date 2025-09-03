const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthenticationError = require('../../exceptions/AuthenticationError');

const validateUserPayload = ({ username, password, fullname }) => {
    // Check if required fields exist
    if (username === undefined || username === null) {
        throw new InvariantError('Gagal menambahkan user. Username wajib diisi');
    }

    if (password === undefined || password === null) {
        throw new InvariantError('Gagal menambahkan user. Password wajib diisi');
    }

    if (fullname === undefined || fullname === null) {
        throw new InvariantError('Gagal menambahkan user. Fullname wajib diisi');
    }

    // Check data types
    if (typeof username !== 'string') {
        throw new InvariantError('Gagal menambahkan user. Username harus berupa string');
    }

    if (typeof password !== 'string') {
        throw new InvariantError('Gagal menambahkan user. Password harus berupa string');
    }

    if (typeof fullname !== 'string') {
        throw new InvariantError('Gagal menambahkan user. Fullname harus berupa string');
    }

    // Check if strings are not empty
    if (username.trim() === '') {
        throw new InvariantError('Gagal menambahkan user. Username tidak boleh kosong');
    }

    if (password.trim() === '') {
        throw new InvariantError('Gagal menambahkan user. Password tidak boleh kosong');
    }

    if (fullname.trim() === '') {
        throw new InvariantError('Gagal menambahkan user. Fullname tidak boleh kosong');
    }

    // Additional validations
    if (username.length > 50) {
        throw new InvariantError('Gagal menambahkan user. Username tidak boleh lebih dari 50 karakter');
    }

    if (password.length < 6) {
        throw new InvariantError('Gagal menambahkan user. Password minimal 6 karakter');
    }

    if (fullname.length > 100) {
        throw new InvariantError('Gagal menambahkan user. Fullname tidak boleh lebih dari 100 karakter');
    }
};

class UsersService {
    constructor() {
        this._pool = new Pool();
    }

    async addUser({ username, password, fullname }) {
        validateUserPayload({ username, password, fullname });
        await this.verifyNewUsername(username);

        const id = `user-${nanoid(16)}`;
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = {
            text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
            values: [id, username, hashedPassword, fullname],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new InvariantError('User gagal ditambahkan');
        }

        return result.rows[0].id;
    }

    async verifyNewUsername(username) {
        const query = {
            text: 'SELECT username FROM users WHERE username = $1',
            values: [username],
        };

        const result = await this._pool.query(query);

        if (result.rows.length > 0) {
            throw new InvariantError('Gagal menambahkan user. Username sudah digunakan.');
        }
    }

    async getUserById(userId) {
        const query = {
            text: 'SELECT id, username, fullname FROM users WHERE id = $1',
            values: [userId],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError('User tidak ditemukan');
        }

        return result.rows[0];
    }

    async verifyUserCredential(username, password) {
        const query = {
            text: 'SELECT id, password FROM users WHERE username = $1',
            values: [username],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new AuthenticationError('Kredensial yang Anda berikan salah');
        }

        const { id, password: hashedPassword } = result.rows[0];

        const match = await bcrypt.compare(password, hashedPassword);

        if (!match) {
            throw new AuthenticationError('Kredensial yang Anda berikan salah');
        }

        return id;
    }

    async getUsersByUsername(username) {
        const query = {
            text: 'SELECT id, username, fullname FROM users WHERE username LIKE $1',
            values: [`%${username}%`],
        };

        const result = await this._pool.query(query);
        return result.rows;
    }
}

module.exports = UsersService;

const InvariantError = require('../../exceptions/InvariantError');
const { NotePayloadSchema } = require('./schema');

const NotesValidator = {
    validateNotePayload: (payload) => {
        const validationnResult = NotePayloadSchema.validate(payload);
        if (validationnResult.error) {
            throw new InvariantError(validationnResult.error.message);
        }
    },
};

module.exports = NotesValidator;

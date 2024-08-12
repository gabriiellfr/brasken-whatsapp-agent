const formatMessage = require('./formatMessage');

const findUser = (users, formattedInfo) => {
    return users.find((u) => {
        if (formattedInfo.length < 9) return false;

        const phone = formatMessage(u['CONTATO']);
        const cpf = formatMessage(u['CPF']);
        return phone.endsWith(formattedInfo) || cpf === formattedInfo;
    });
};

module.exports = { findUser };

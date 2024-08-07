//whatsapp.helper.js

const handleResponse = (message, chatId, client) => {
    client.sendMessage(
        chatId,
        'Até breve! Se precisar de mais alguma coisa, é só chamar.',
    );
};

module.exports = {
    handleResponse,
};

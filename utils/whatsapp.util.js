//whatsapp.helper.js

const formatMessage = require('./formatMessage');
const { findUser } = require('./userUtils');

const handleResponse = (message, chatId, client, states, users) => {
    const state = states[chatId] || 'START';

    switch (state) {
        case 'START':
            states[chatId] = 'WAITING_FOR_OPTION';
            client.sendMessage(
                chatId,
                'Olá! Por favor escolha uma das opções:\n\n1. Verificar local de trabalho.\n\n2. Falar com planejamento.',
            );
            break;

        case 'WAITING_FOR_OPTION':
            if (message.body === '1') {
                states[chatId] = 'WAITING_FOR_INFO';
                client.sendMessage(
                    chatId,
                    'Você selecionou "Procurar funcionário". Por favor forneça o CPF ou telefone do funcionário que deseja consultar.',
                );
            } else if (message.body === '2') {
                states[chatId] = 'SUPPORT';
                client.sendMessage(
                    chatId,
                    'Você selecionou "Falar com planejamento". Por favor aguarde, em instantes você será atendido.',
                );
            } else {
                client.sendMessage(
                    chatId,
                    'Opção inválida. Por favor escolha uma opção válida.',
                );
            }
            break;

        case 'WAITING_FOR_INFO':
            const formattedInfo = formatMessage(message.body);

            const user = findUser(users, formattedInfo);

            if (user) {
                let response = 'Detalhes do funcionário:\n\n';
                for (const [key, value] of Object.entries(user)) {
                    switch (key) {
                        case 'FUNCAO':
                            response += `${key}: ${value || 'N/A'}\n\n`;
                            break;

                        case 'LOCAÇÃO':
                            response += `${key}: \n${value || 'N/A'}\n\n`;
                            break;

                        case 'SUPERVISOR':
                            response += `${key}: \n${value || 'N/A'}\n\n`;
                            break;

                        case 'LÍDER':
                            response += `${key}: \n${value || 'N/A'}\n\n`;
                            break;

                        case 'LOCAÇÃO':
                            response += `${key}: \n${value || 'N/A'}\n\n`;
                            break;

                        case 'VALIDADE - ASO':
                            if (user['ASO TBS'])
                                response += `${key}: ${value} dias\n\n`;
                            else response += `${key}: 'N/A'\n\n`;
                            break;

                        case 'VENC- PT':
                            if (user['PT VENC'])
                                response += `${key}: ${value} dias\n\n`;
                            else response += `${key}: N/A\n\n`;
                            break;

                        case 'NR 35':
                            response += `${key}: ${value || 'N/A'}\n\n`;
                            break;

                        case 'CONTATO':
                            response += `${key}: ${value.trim() || 'N/A'}`;
                            break;

                        default:
                            response += `${key}: ${value || 'N/A'}\n`;
                            break;
                    }
                }
                client.sendMessage(chatId, response);

                setTimeout(() => {
                    delete states[chatId];
                    client.sendMessage(
                        chatId,
                        'Até breve! Se precisar de mais alguma coisa, é só chamar.',
                    );
                }, 2000);
            } else {
                client.sendMessage(
                    chatId,
                    'Funcionário não encontrado. Por favor, verifique as informações e tente novamente.',
                );

                states[chatId] = 'ASK_TO_TRY_AGAIN';
                setTimeout(() => {
                    client.sendMessage(
                        chatId,
                        'Deseja fazer outra pesquisa? (sim/não)',
                    );
                }, 2000);
            }
            break;

        case 'ASK_TO_TRY_AGAIN':
            if (message.body.toLowerCase() === 'sim') {
                states[chatId] = 'WAITING_FOR_OPTION';
                client.sendMessage(
                    chatId,
                    'Escolha uma das opções:\n1. Procurar funcionário',
                );
            } else if (
                message.body.toLowerCase() === 'não' ||
                message.body.toLowerCase() === 'nao'
            ) {
                delete states[chatId];
                client.sendMessage(
                    chatId,
                    'Até breve! Se precisar de mais alguma coisa, é só chamar.',
                );
            } else {
                client.sendMessage(
                    chatId,
                    'Resposta inválida. Por favor responda com "sim" ou "não".',
                );
            }
            break;

        case 'SUPPORT':
            break;

        default:
            delete states[chatId];
            client.sendMessage(
                chatId,
                'Olá! Por favor escolha uma das opções:\n\n1. Verificar local de trabalho.\n\n2. Falar com planejamento.',
            );
            break;
    }
};

module.exports = {
    handleResponse,
};

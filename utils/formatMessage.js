const formatMessage = (message) => {
    return (message || '').toString().trim().replace(/\D/g, '');
};

module.exports = formatMessage;

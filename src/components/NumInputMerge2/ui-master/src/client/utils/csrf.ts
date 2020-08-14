// Helper for CSRF token management

const getCsrfToken = (): string => {
    // Read the CSRF token from the <meta> tag within the dust file
    const csrfToken = $('meta[name="csrf-token"]').attr('content');
    return csrfToken;
};

export default {
    getCsrfToken
};

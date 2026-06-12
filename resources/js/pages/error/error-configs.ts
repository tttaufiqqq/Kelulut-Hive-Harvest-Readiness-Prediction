export interface ErrorConfig {
    title: string;
    message: string;
    reason: string;
}

export const errorConfigs: Record<number, ErrorConfig> = {
    403: {
        title: 'Access Restricted',
        message: "You don't have permission to access this area.",
        reason: 'Your account does not have the role or permission required for this page or action.',
    },
    404: {
        title: 'Page Not Found',
        message: "The page you're looking for doesn't exist or has been moved.",
        reason: 'The page, record, or file may have been moved, deleted, or the link may be outdated.',
    },
    500: {
        title: 'Server Error',
        message: 'We could not complete your request.',
        reason: 'The server hit an unexpected problem while processing the request.',
    },
    419: {
        title: 'Session Expired',
        message: 'Your session expired before the page could finish loading.',
        reason:
            'The security token for the page timed out, usually because the page stayed open too long before submission.',
    },
    429: {
        title: 'Too Many Requests',
        message: 'Too many requests were sent in a short time.',
        reason:
            'BuzzyHive temporarily rate-limited this action to protect the service from repeated requests.',
    },
    503: {
        title: 'Service Unavailable',
        message: 'A required service is temporarily unavailable.',
        reason:
            'BuzzyHive could not reach a dependency it needed to finish the request, such as storage, email, or another backend service.',
    },
};

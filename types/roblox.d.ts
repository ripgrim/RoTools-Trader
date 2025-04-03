type AuthResponse = {
    isValid: boolean,
    user: {
        id: string,
        name: string,
        displayName: string
    }
}

type RobloxProfile = {
    description: string,
    created: string,
    isBanned: boolean,
    externalAppDisplayName: string | null,
    hasVerifiedBadge: boolean,
    id: number,
    name: string,
    displayName: string,
}
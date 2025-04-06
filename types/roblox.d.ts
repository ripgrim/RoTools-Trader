type AuthResponse = {
    isValid: boolean,
    user: {
        id: number,
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
    avatarUrl: string,
}

type ResaleData = {
    assetStock: number;
    sales: number;
    numberRemaining: number;
    recentAveragePrice: number;
    originalPrice: number;
    priceDataPoints: {
        value: number;
        date: string;
    }[];
}
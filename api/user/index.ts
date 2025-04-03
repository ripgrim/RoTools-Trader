export async function verifyAuthToken(token: string) {
    const response = await fetch('https://users.roblox.com/v1/users/authenticated', {
        headers: {
            'Cookie': `.ROBLOSECURITY=${token}`,
        },
        cache: "no-store"
    })
    if (!response.ok) {
        throw new Error(`failed to get authenticated user (${response.status}): ${await response.text()}`)
    } else {
        const authData = await response.json()
        return {
            isValid: true,
            user: {
              id: authData.id,
              name: authData.name,
              displayName: authData.displayName,
            }
        } as AuthResponse
    }
}

export async function getProfile(token: string, userId?: string) {
    if (!userId) {
        // no user id provided, get currently authenticated user
        const userDetails = await verifyAuthToken(token)
        userId = userDetails.user.id
    }
    const profileResponse = await fetch(`https://users.roblox.com/v1/users/${userId!}`);
    if (!profileResponse.ok) {
        throw new Error(`failed to get profile ${userId} (${profileResponse.status}): ${await profileResponse.text()}`)
    }
    return (await profileResponse.json()) as RobloxProfile
}
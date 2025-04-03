"use server"
import { getBatchThumbnails } from "../thumbnails"

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

export async function verifyAuthTokenExtended(token: string) {
    const auth = await verifyAuthToken(token)
    const picture = await getBatchThumbnails([{type: "Avatar", id: auth.user.id, format: "webp", size: "150x150"}])
    return {...auth, user: {...auth.user, avatarUrl: picture[String(auth.user.id)]!}}
}

export async function getProfile(token: string, userId?: string) {
    if (!userId) {
        // no user id provided, get currently authenticated user
        const userDetails = await verifyAuthToken(token)
        userId = String(userDetails.user.id)
    }
    const profileResponse = await fetch(`https://users.roblox.com/v1/users/${userId!}`);
    if (!profileResponse.ok) {
        throw new Error(`failed to get profile ${userId} (${profileResponse.status}): ${await profileResponse.text()}`)
    }
    const picture = await getBatchThumbnails([{type: "Avatar", id: userId, format: "webp", size: "150x150"}])
    return {...(await profileResponse.json()), avatarUrl: picture[userId]} as RobloxProfile
}
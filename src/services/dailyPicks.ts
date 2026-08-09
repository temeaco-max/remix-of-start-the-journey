import { getProfile } from './memoryProfile.js';

export async function getDailyPick(phone?: string) {
    let location = 'Bodija Market';
    let userPref = '';
    
    if (phone) {
        const profile = await getProfile(phone, 'daily_picks');
        if (profile) {
            if (profile.location) {
                location = profile.location;
            }
            if (profile.preferences && profile.preferences.usual_bakery) {
                userPref = profile.preferences.usual_bakery;
            }
        }
    }

    if (userPref) {
        return {
            title: `Today's Kurukoo Pick for ${userPref}`,
            description: `Fresh bakery items and provisions from ${userPref} delivered straight to your door.`,
            price: "₦3,200",
            creditReward: 1
        };
    }

    return {
        title: "Today's Kurukoo Daily Pick",
        description: `Fresh organic yam & palm oil bundles delivered straight from ${location} with free runner delivery.`,
        price: "₦12,500",
        creditReward: 1
    };
}

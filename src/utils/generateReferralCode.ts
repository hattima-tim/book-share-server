/**
 * Generate a unique referral code
 * Uses a combination of timestamp and random alphanumeric characters
 * @returns Uppercase alphanumeric referral code (6-8 characters)
 */
export const generateReferralCode = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const timestamp = Date.now().toString(36).toUpperCase();

    let randomPart = '';
    const randomLength = Math.floor(Math.random() * 3) + 4;

    for (let i = 0; i < randomLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomPart += characters[randomIndex];
    }

    const timestampPart = timestamp.slice(-2);
    const code = (randomPart + timestampPart).slice(0, 8);

    return code.toUpperCase();
};

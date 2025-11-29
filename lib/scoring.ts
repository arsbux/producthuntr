export function calculateLaunchScore(product: any, velocity: number): { score: number, grade: string, breakdown: any } {
    let score = 50; // Base score
    const breakdown: any = { base: 50 };

    // 1. Velocity Impact (Max 20)
    const velocityBonus = Math.min(20, velocity * 2);
    score += velocityBonus;
    breakdown.velocity = velocityBonus;

    // 2. Traction Rate (Votes per Hour) (Max 20)
    // Assuming launched_at is available, otherwise fallback to snapshot_time or now - 24h
    const launchDate = product.launched_at ? new Date(product.launched_at) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hoursSinceLaunch = Math.max(1, (Date.now() - launchDate.getTime()) / (1000 * 60 * 60));
    const tractionRate = product.votes_count / hoursSinceLaunch;
    const tractionBonus = Math.min(20, Math.round(tractionRate * 2));
    score += tractionBonus;
    breakdown.traction = tractionBonus;

    // 3. Maker Influence (Max 10)
    const makerBonus = Math.min(10, (product.makers?.length || 0) * 2);
    score += makerBonus;
    breakdown.makers = makerBonus;

    // 4. Category/Topic Bonus (Max 10)
    const hotTopics = ['ai', 'gpt', 'developer', 'api', 'productivity', 'mac', 'design'];
    const topicBonus = product.topics?.some((t: string) => hotTopics.some(ht => t.toLowerCase().includes(ht))) ? 10 : 0;
    score += topicBonus;
    breakdown.topics = topicBonus;

    // Cap at 100
    score = Math.min(100, Math.round(score));

    // Determine Grade
    let grade = 'C';
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 60) grade = 'C';
    else grade = 'D';

    return { score, grade, breakdown };
}

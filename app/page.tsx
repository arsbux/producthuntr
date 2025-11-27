import { getTopicVelocity } from '@/lib/charts-data';
import CategoryTrendsDashboard from '@/components/CategoryTrendsDashboard';
import DeskLayout from '@/components/DeskLayout';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
    const trendsData = await getTopicVelocity(12);

    return (
        <DeskLayout>
            <CategoryTrendsDashboard data={trendsData} />
        </DeskLayout>
    );
}

import { getCategoryDetails } from '@/lib/charts-data';
import DeskLayout from '@/components/DeskLayout';
import CategoryProfile from '@/components/CategoryProfile';

export default async function CategoryPage({ params }: { params: { slug: string } }) {
    const topic = decodeURIComponent(params.slug);
    const data = await getCategoryDetails(topic);

    if (!data) {
        return (
            <DeskLayout>
                <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold text-gray-900">Category Not Found</h1>
                    <p className="text-gray-500 mt-2">Could not find data for "{topic}".</p>
                </div>
            </DeskLayout>
        );
    }

    return (
        <DeskLayout>
            <CategoryProfile data={data} />
        </DeskLayout>
    );
}

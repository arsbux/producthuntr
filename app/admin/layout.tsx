import DeskLayout from '@/components/DeskLayout';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DeskLayout>{children}</DeskLayout>;
}

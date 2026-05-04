"use client";
import '../globals.css';

import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from '@/components/admincomponents/layout/AdminSidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';


export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-white text-black">
			<SidebarProvider>
				<ProtectedRoute requiredRole="admin">
					<AdminSidebar />
					<div className="p-0 w-full min-h-screen">
						<main className="p-6">{children}</main>
					</div>
				</ProtectedRoute>
			</SidebarProvider>
		</div>
	);
}
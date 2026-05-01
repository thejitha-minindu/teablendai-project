export default function ExportAnalyticsPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-white py-16 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="text-center mb-14">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-green-900 mb-4 leading-tight">
                        Export Analytics
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                        Data-driven insights for international tea trade
                    </p>

                    {/* Decorative Divider */}
                    <div className="mt-6 flex justify-center">
                        <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-md border border-green-100 rounded-2xl shadow-xl p-8 md:p-12 transition-all duration-300 hover:shadow-2xl">

                    {/* Feature Highlights */}
                    <div className="grid md:grid-cols-3 gap-6 mb-10">

                        <div className="bg-green-50 rounded-xl p-5 text-center hover:scale-105 transition">
                            <h3 className="font-semibold text-green-800 mb-2">
                                Global Demand Tracking
                            </h3>
                            <p className="text-sm text-gray-600">
                                Monitor demand patterns across key importing countries
                            </p>
                        </div>

                        <div className="bg-emerald-50 rounded-xl p-5 text-center hover:scale-105 transition">
                            <h3 className="font-semibold text-emerald-800 mb-2">
                                Trade Intelligence
                            </h3>
                            <p className="text-sm text-gray-600">
                                Access tariffs, regulations, and quality standards
                            </p>
                        </div>

                        <div className="bg-green-50 rounded-xl p-5 text-center hover:scale-105 transition">
                            <h3 className="font-semibold text-green-800 mb-2">
                                Revenue Optimization
                            </h3>
                            <p className="text-sm text-gray-600">
                                Improve pricing and expand global market reach
                            </p>
                        </div>

                    </div>

                    {/* Content */}
                    <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
                        <p>
                            Our export analytics platform provides comprehensive data-driven insights
                            for international tea trade. Track global demand patterns, regulatory requirements,
                            shipping routes, and the competitive landscape across major tea importing countries.
                        </p>

                        <p>
                            Optimize your export strategy with detailed market intelligence, including tariff
                            information, quality standards, and consumer trends in target markets. Make informed
                            decisions to expand your international presence and maximize export revenues.
                        </p>
                    </div>

                </div>
            </div>
        </main>
    );
}
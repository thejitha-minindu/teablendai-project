export default function MarketAnalysisPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-white py-16 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="text-center mb-14">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-green-900 mb-4 leading-tight">
                        Market Analysis
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                        Real-time insights on tea market trends and pricing
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
                                Real-Time Data
                            </h3>
                            <p className="text-sm text-gray-600">
                                Track live market prices and demand changes instantly
                            </p>
                        </div>

                        <div className="bg-emerald-50 rounded-xl p-5 text-center hover:scale-105 transition">
                            <h3 className="font-semibold text-emerald-800 mb-2">
                                Global Insights
                            </h3>
                            <p className="text-sm text-gray-600">
                                Analyze import/export trends across regions
                            </p>
                        </div>

                        <div className="bg-green-50 rounded-xl p-5 text-center hover:scale-105 transition">
                            <h3 className="font-semibold text-green-800 mb-2">
                                Predictive Analytics
                            </h3>
                            <p className="text-sm text-gray-600">
                                Forecast trends to make smarter business decisions
                            </p>
                        </div>

                    </div>

                    {/* Content */}
                    <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
                        <p>
                            Our market analysis tool provides real-time insights into tea market trends,
                            pricing dynamics, and consumer preferences. Using advanced data analytics
                            and machine learning, we track global tea production, import/export volumes,
                            and price fluctuations across different regions and tea varieties.
                        </p>

                        <p>
                            Stay ahead of the competition with predictive analytics that help you identify
                            emerging trends, optimize pricing strategies, and make informed decisions about
                            inventory management and market positioning.
                        </p>
                    </div>

                </div>
            </div>
        </main>
    );
}
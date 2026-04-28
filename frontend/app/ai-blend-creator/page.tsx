export default function AIBlendCreatorPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-white py-16 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Header Section */}
                <div className="text-center mb-14">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-green-900 mb-4 leading-tight">
                        AI Tea Blend Creator
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                        Generate perfect tea blends using intelligent machine learning models
                    </p>

                    {/* Decorative Line */}
                    <div className="mt-6 flex justify-center">
                        <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-md border border-green-100 rounded-2xl shadow-xl p-8 md:p-12 transition-all duration-300 hover:shadow-2xl">

                    {/* Feature Highlight */}
                    <div className="grid md:grid-cols-3 gap-6 mb-8">

                        <div className="bg-green-50 rounded-xl p-5 text-center hover:scale-105 transition">
                            <h3 className="font-semibold text-green-800 mb-2">
                                Smart Flavor Matching
                            </h3>
                            <p className="text-sm text-gray-600">
                                AI analyzes taste profiles to create balanced blends
                            </p>
                        </div>

                        <div className="bg-emerald-50 rounded-xl p-5 text-center hover:scale-105 transition">
                            <h3 className="font-semibold text-emerald-800 mb-2">
                                Aroma Optimization
                            </h3>
                            <p className="text-sm text-gray-600">
                                Enhance fragrance combinations for premium quality
                            </p>
                        </div>

                        <div className="bg-green-50 rounded-xl p-5 text-center hover:scale-105 transition">
                            <h3 className="font-semibold text-green-800 mb-2">
                                Market Insights
                            </h3>
                            <p className="text-sm text-gray-600">
                                Align blends with current global demand trends
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 leading-relaxed text-lg mb-8">
                        Discover a smarter way to craft the perfect tea blend tailored to your exact needs.
                        Our AI-powered system analyzes flavor profiles, aroma combinations, and ingredient
                        compatibility to generate unique blends that match your preferences or market demand.
                        Whether you're a producer experimenting with new recipes or a tea enthusiast exploring
                        new tastes, this tool simplifies the blending process while maintaining consistency
                        and quality.
                    </p>

                </div>
            </div>
        </main>
    );
}
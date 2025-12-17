export default function Signup() {
    return (
        <div className="flex h-[725px] w-full bg-white text-black">
            <div className="w-full hidden md:inline-block">
                <img className="h-full" src="/login-image.webp" alt="leftSideImage" />
            </div>
            <div className="absolute top-5 left-5">
                <img src="/tea-blend-logo.svg" alt="Tea Blend Logo" className="h-[80px] " />
            </div>

            <div className="w-full flex flex-col items-center justify-center">

                <div className="md:w-96 w-80 flex flex-col items-center justify-center">
                    <h2 className="text-4xl text-gray-900 font-bold">Create new Account</h2>
                    <p className="mt-3 text-center">
                        <span className="block text-lg font-semibold text-black">
                            Welcome to TeaBlend AI!
                        </span><br />
                    </p>
                    <form>
                        <div className="text-right py-4">
                            <input id="email" className="w-full bg-transparent border my-2 border-gray-500/30 outline-none rounded-full py-2.5 px-4" type="email" placeholder="Enter your email" required />
                            <input id="password" className="w-full bg-transparent border my-2 border-gray-500/30 outline-none rounded-full py-2.5 px-4" type="password" placeholder="Enter your password" required />
                            <input id="confirmPassword" className="w-full bg-transparent border my-2 border-gray-500/30 outline-none rounded-full py-2.5 px-4" type="password" placeholder="Confirm your password" required />

                        </div>
                        <button type="submit" className="w-full mb-3 border my-4 bg-indigo-500 py-2.5 rounded-full text-white">Sign in</button>
                    </form>

                    <p className="text-blac text-sm mt-4">Already have an account? <a className="text-indigo-500 hover:underline" href="/auth/login">log in</a></p>
                </div>
            </div>
        </div>
    );
};
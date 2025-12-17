export default function Login() {
    return (
        <div className="flex h-[725px] w-full bg-white text-black">
            <div className="w-full hidden md:inline-block">
                <img className="h-full" src="/login-image.webp" alt="leftSideImage" />
            </div>

             <div className="absolute top-0 left-0">
              <img src="/TeaLogo.png" alt="overlayImage" className="h-[100px] " />
               </div>
        
            <div className="w-full flex flex-col items-center justify-center">
        
                <form className="md:w-96 w-80 flex flex-col items-center justify-center">
                    <h2 className="text-4xl text-gray-900 font-bold">Sign in</h2>
                   <p className="mt-3 text-center">
                   <span className="block text-lg font-semibold text-black">
                      Welcome to TeaBlend AI!
                  </span><br />
                    <span className="block text-sm text-black/70">
                         Please sign in to continue
                    </span>
                  </p>

                   <a
                        href="https://accounts.google.com"
                        className="w-full mt-5 bg-gray-500/10 flex items-center justify-center gap-2 h-12 rounded-full"
>
                        <img src="/google-logo.png" alt="Google logo" className="h-5 w-5" />
                        <span className="text-sm text-black"> Google</span>
                  </a>

                    <div className="flex items-center gap-4 w-full my-5">
                        <div className="w-full h-px bg-gray-300/90"></div>
                        <p className="w-full text-nowrap text-sm text-gray-700/90">or sign in with email</p>
                        <div className="w-full h-px bg-gray-300/90"></div>
                    </div>
        
                    <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2">
                    <img
                    src="/email-logo.png"
                    alt="Email icon"
                    className="h-3 w-4 opacity-50"
                    />

                    <input
                    type="email"
                    placeholder="Email id"
                    className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                    required
                    />
                    </div>

        
                    <div className="flex items-center mt-6 w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2">
               <img
                  src="/password-logo.png"
                   alt="Password icon"
                  className="h-4 w-4 opacity-50"
                  />
                 <input
                  type="password"
                  placeholder="Password"
                  className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                   required
                   />
                </div>

        
                    <div className="w-full flex items-center justify-between mt-8 text-black">
                        <div className="flex items-center gap-2">
                            <input className="h-5" type="checkbox" id="checkbox" />
                            <label className="text-sm" htmlFor="checkbox">Remember me</label>
                        </div>
                        <a className="text-sm underline" href="#">Forgot password?</a>
                    </div>
        
                    <button type="submit" className="mt-8 w-full h-11 rounded-full text-white bg-indigo-500 hover:opacity-90 transition-opacity">
                        Login
                    </button>
                    <p className="text-blac text-sm mt-4">Don’t have an account? <a className="text-indigo-500 hover:underline" href="/auth/signup">Sign up</a></p>
                </form>
            </div>
        </div>
    );
};
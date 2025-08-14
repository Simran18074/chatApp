import firstBg from "../assets/firstBackground.png";

const AuthLayout = ({ children, title }) => {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage: `url(${firstBg})`,
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Floating shapes */}
      <div className="absolute w-72 h-72 bg-purple-500/20 rounded-full blur-3xl top-10 left-10 animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-pink-500/10 rounded-full blur-3xl bottom-10 right-20 animate-pulse"></div>
      <div className="absolute w-40 h-40 bg-purple-300/20 rounded-full blur-2xl top-1/3 left-1/2"></div>

      {/* Semi-transparent lines */}
      <div className="absolute w-[2px] h-96 bg-purple-400/20 top-0 left-1/3"></div>
      <div className="absolute w-[2px] h-96 bg-pink-400/20 bottom-0 right-1/4"></div>

      {/* Glassmorphism Card */}
      <div className="relative bg-white/10 backdrop-blur-2xl p-8 rounded-2xl shadow-2xl border border-white/30 w-full max-w-md z-10">
        {title && (
          <h2 className="text-4xl font-bold text-white mb-8 text-center tracking-wide drop-shadow-md">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;

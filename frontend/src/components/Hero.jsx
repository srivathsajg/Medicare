import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, CheckCircle } from 'lucide-react';

const Hero = () => {
  const images = [
    "https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&h=800&q=80",
    "https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&h=800&q=80",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&h=800&q=80",
    "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&h=800&q=80",
    "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&h=800&q=80",
    "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&h=800&q=80",
    "https://images.unsplash.com/photo-1576091160550-217358c7db81?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&h=800&q=80",
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&h=800&q=80",
    "https://images.unsplash.com/photo-1581056771107-24ca5f033842?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&h=800&q=80",
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative bg-[#f9fafb] overflow-hidden min-h-[calc(100vh-80px)] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div className="space-y-8 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">
              Healthcare, <br className="hidden lg:block" />
              <span className="text-green-500">Secured with</span> <span className="text-gray-900">MediCare</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              Experience the future of medical record management. Secure, decentralized, and patient-centric healthcare solutions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button className="w-full sm:w-auto px-8 py-4 bg-green-500 text-white font-bold rounded-full shadow-lg hover:bg-green-600 hover:shadow-green-200 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-lg">
                Get Started
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-800 font-bold border-2 border-gray-200 rounded-full shadow-sm hover:border-green-500 hover:text-green-600 transition-all text-lg">
                Learn More
              </button>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 sm:gap-12">
              <div className="flex items-center gap-3 group">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow border border-gray-100">
                  <ShieldCheck className="w-8 h-8 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-lg">100% Secure</p>
                  <p className="text-sm text-gray-500 font-medium">Encrypted Data</p>
                </div>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow border border-gray-100">
                  <UserCheck className="w-8 h-8 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-lg">Certified Doctors</p>
                  <p className="text-sm text-gray-500 font-medium">Trusted Globally</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="relative lg:h-full flex items-center justify-center">
            <div className="relative w-full max-w-lg lg:max-w-xl">
              {/* Background Blobs */}
              <div className="absolute top-0 -left-4 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
              <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
              
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform hover:scale-[1.01] transition-transform duration-500 aspect-[5/4]">
                 {images.map((src, index) => (
                   <img 
                    key={index}
                    src={src} 
                    alt={`Healthcare professional ${index + 1}`} 
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                      index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                 ))}
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

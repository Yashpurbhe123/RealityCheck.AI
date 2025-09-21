
interface VerificationLoadingProps {
  isVisible: boolean
}

export default function VerificationLoading({ isVisible }: VerificationLoadingProps) {
  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      animation: 'fadeIn 0.3s ease'
    }}>
      {/* Background Gradient Orbs */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '60px 50px',
        borderRadius: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        maxWidth: '450px',
        width: '90%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Elements */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '100px',
          height: '100px',
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          borderRadius: '50%',
          animation: 'rotate 10s linear infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
          borderRadius: '50%',
          animation: 'rotate 8s linear infinite reverse'
        }} />

        {/* Gemini Symbol with Fading Animation */}
        <div style={{
          position: 'relative',
          marginBottom: '32px'
        }}>
          {/* Outer Ring */}
          <div style={{
            width: '120px',
            height: '120px',
            border: '3px solid rgba(147, 51, 234, 0.3)',
            borderRadius: '50%',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'spin 3s linear infinite'
          }} />
          
          {/* Inner Ring */}
          <div style={{
            width: '100px',
            height: '100px',
            border: '2px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '50%',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'spin 2s linear infinite reverse'
          }} />

          {/* Gemini Symbol */}
          <div style={{
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            animation: 'geminiFade 2s ease-in-out infinite alternate',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            ⭐
          </div>

          {/* Pulsing Dots */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '140px',
            height: '140px'
          }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#9333ea',
                  borderRadius: '50%',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-70px)`,
                  animation: `pulseDot 1.5s ease-in-out ${i * 0.1}s infinite`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Loading Text with Gradient */}
        <h3 style={{
          margin: '0 0 16px',
          fontSize: '24px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          animation: 'textShimmer 2s ease-in-out infinite alternate'
        }}>
          AI Verification in Progress
        </h3>
        
        <p style={{
          margin: '0 0 24px',
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.6',
          fontWeight: '500'
        }}>
          Our advanced AI is analyzing the tweet content for accuracy, context, and potential misinformation...
        </p>
        
        {/* Enhanced Loading Dots Animation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '20px'
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '12px',
                height: '12px',
                background: `linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)`,
                borderRadius: '50%',
                animation: `enhancedPulse 1.4s ease-in-out ${i * 0.2}s infinite both`,
                boxShadow: `0 0 20px rgba(147, 51, 234, 0.5)`
              }}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{
          marginTop: '24px',
          width: '100%',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #9333ea 0%, #3b82f6 100%)',
            borderRadius: '2px',
            animation: 'progressBar 3s ease-in-out infinite'
          }} />
        </div>
        
        {/* CSS Animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
          
          @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes geminiFade {
            0% { 
              opacity: 0.6;
              transform: translate(-50%, -50%) scale(0.9);
            }
            100% { 
              opacity: 1;
              transform: translate(-50%, -50%) scale(1.1);
            }
          }
          
          @keyframes pulseDot {
            0%, 100% {
              opacity: 0.3;
              transform: translate(-50%, -50%) scale(0.8);
            }
            50% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1.2);
            }
          }
          
          @keyframes enhancedPulse {
            0%, 100% {
              transform: scale(0.8);
              opacity: 0.5;
            }
            50% {
              transform: scale(1.2);
              opacity: 1;
            }
          }
          
          @keyframes textShimmer {
            0% { 
              background-position: -200% center;
            }
            100% { 
              background-position: 200% center;
            }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes progressBar {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    </div>
  )
}

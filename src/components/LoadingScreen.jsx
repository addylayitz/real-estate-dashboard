// src/components/LoadingScreen.jsx - 全螢幕載入畫面
import { useEffect, useState } from 'react';

const LoadingScreen = ({ progress = 0, status = '', cityName = '', onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (progress >= 100 && onComplete) {
      // 載入完成,開始淡出動畫
      setFadeOut(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 800); // 800ms 淡出動畫
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-800 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%)',
      }}
    >
      <div className="flex flex-col items-center justify-center h-full px-4">
        {/* Logo 和標題 */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="text-7xl mb-6 animate-bounce-slow">📊</div>
          <h1 className="text-white text-4xl md:text-5xl font-bold mb-3">
            預售屋數據儀表板
          </h1>
          <p className="text-blue-200 text-lg md:text-xl">
            正在載入約 17 萬筆預售屋交易資料
          </p>
        </div>

        {/* 進度條容器 */}
        <div className="w-full max-w-md mb-8">
          {/* 進度條背景 */}
          <div className="relative h-3 bg-blue-800/50 rounded-full overflow-hidden backdrop-blur-sm">
            {/* 進度條 */}
            <div
              className="absolute h-full bg-gradient-to-r from-white via-blue-100 to-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* 光澤效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>

          {/* 進度百分比 */}
          <div className="flex justify-between items-center mt-3">
            <span className="text-blue-200 text-sm font-medium">
              {progress.toFixed(0)}%
            </span>
            <span className="text-blue-200 text-sm font-medium">
              {progress >= 100 ? '完成' : '載入中'}
            </span>
          </div>
        </div>

        {/* 狀態訊息 */}
        <div className="text-center space-y-2 animate-fade-in">
          <div className="text-white text-lg md:text-xl font-medium">
            {status || '準備中...'}
          </div>
          {cityName && (
            <div className="text-blue-300 text-base md:text-lg flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-300 rounded-full animate-pulse"></span>
              {cityName}
            </div>
          )}
        </div>

        {/* 提示訊息 */}
        <div className="absolute bottom-8 text-center px-4">
          <p className="text-blue-200 text-sm md:text-base">
            💡 資料將儲存在瀏覽器本地,下次訪問無需重新載入
          </p>
        </div>
      </div>

      {/* 動畫樣式 */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;

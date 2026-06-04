// src/ui/PowerUpNotification.tsx
// 道具拾取通知组件 - 显示在屏幕中央的临时提示

import React, { useEffect, useState, CSSProperties } from 'react';
import { EventBus } from '../game/EventBus';

interface NotificationData {
  message: string;
  timestamp: number;
}

export const PowerUpNotification: React.FC = () => {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (message: string) => {
      // 显示新通知
      setNotification({ message, timestamp: Date.now() });
      setVisible(true);
      
      // 2秒后隐藏
      setTimeout(() => {
        setVisible(false);
      }, 2000);
    };

    EventBus.on('show-message', handler);
    
    return () => {
      EventBus.off('show-message', handler);
    };
  }, []);

  if (!notification || !visible) return null;

  const containerStyle: CSSProperties = {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
    pointerEvents: 'none',
    textAlign: 'center',
  };

  const textStyle: CSSProperties = {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '14px',
    color: '#ffff00',
    textShadow: '0 0 10px #ffaa00, 0 0 20px #ff6600',
    letterSpacing: '2px',
    animation: 'notificationPop 0.3s ease-out',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={containerStyle}>
      <div style={textStyle}>{notification.message}</div>
      <style>{`
        @keyframes notificationPop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

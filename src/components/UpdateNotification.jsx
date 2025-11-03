// src/components/UpdateNotification.jsx - 更新通知組件
import { useEffect, useState } from 'react';
import { CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';

const UpdateNotification = ({ visible, message, type = 'info', onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      
      // 成功訊息 3 秒後自動關閉
      if (type === 'success' && onClose) {
        const timer = setTimeout(() => {
          setShow(false);
          setTimeout(onClose, 300);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setShow(false);
    }
  }, [visible, type, onClose]);

  if (!visible) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-blue-500';
  const icon = type === 'success' ? <CheckCircleOutlined /> : <SyncOutlined spin />;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className={`${bgColor} text-white shadow-lg rounded-lg px-6 py-4 flex items-center gap-3 min-w-[300px]`}>
        <div className="text-xl">{icon}</div>
        <div className="flex-1">
          <div className="font-medium">{message}</div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, Button, Empty, Spin, Badge, Space, Divider, Typography } from 'antd';
import {
  BellOutlined,
  CloseOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RightOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  fetchAlerts,
  fetchUnreadCount,
  markAlertRead,
  markAllAlertsRead,
} from '../../redux/features/cacCompliance';

const { Text } = Typography;

const getAlertIcon = (alertType) => {
  switch (alertType) {
    case 'violation_detected':
    case 'risk_escalated':
      return <WarningOutlined className="w-5 h-5 text-red-500" />;
    case 'deadline_7_days':
      return <ClockCircleOutlined className="w-5 h-5 text-orange-500" />;
    case 'deadline_30_days':
    case 'deadline_60_days':
      return <ClockCircleOutlined className="w-5 h-5 text-blue-500" />;
    default:
      return <BellOutlined className="w-5 h-5 text-gray-500" />;
  }
};

const getAlertBgColor = (alertType) => {
  switch (alertType) {
    case 'violation_detected':
    case 'risk_escalated':
      return 'bg-red-50 border-red-200';
    case 'deadline_7_days':
      return 'bg-orange-50 border-orange-200';
    case 'deadline_30_days':
    case 'deadline_60_days':
      return 'bg-blue-50 border-blue-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const AlertPanel = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { alerts, unreadCount, isLoading } = useSelector((state) => state.cacAlerts);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAlerts());
      dispatch(fetchUnreadCount());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    setLocalUnreadCount(unreadCount);
  }, [unreadCount]);

  const handleMarkRead = async (alertId) => {
    await dispatch(markAlertRead(alertId));
    setLocalUnreadCount(Math.max(0, localUnreadCount - 1));
  };

  const handleMarkAllRead = async () => {
    await dispatch(markAllAlertsRead());
    setLocalUnreadCount(0);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20" />
      
      <div 
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BellOutlined className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Alerts</h3>
                {localUnreadCount > 0 && (
                  <Badge count={localUnreadCount} className="mt-1" />
                )}
              </div>
            </div>
            <Button 
              type="text" 
              icon={<CloseOutlined className="w-5 h-5" />}
              onClick={onClose}
            />
          </div>

          {localUnreadCount > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <Button 
                type="link" 
                onClick={handleMarkAllRead}
                className="p-0 text-blue-600"
              >
                Mark all as read
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Spin />
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="p-4 space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                      alert.isRead 
                        ? 'bg-white border-gray-200 opacity-75' 
                        : getAlertBgColor(alert.alertType)
                    } ${!alert.isRead ? 'border-l-4' : ''}`}
                    onClick={() => !alert.isRead && handleMarkRead(alert._id)}
                    style={{
                      borderLeftColor: !alert.isRead 
                        ? alert.alertType === 'violation_detected' || alert.alertType === 'risk_escalated'
                          ? '#dc2626'
                          : alert.alertType === 'deadline_7_days'
                          ? '#ea580c'
                          : '#3b82f6'
                        : undefined
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getAlertIcon(alert.alertType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Text className="font-medium text-sm">
                            {alert.companyId?.name || 'Unknown Company'}
                          </Text>
                          {!alert.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Text className="text-xs text-gray-400">
                            {new Date(alert.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                          <Link 
                            to={`/dashboard/cac-compliance/companies/${alert.companyId?._id}`}
                            onClick={onClose}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            View <RightOutlined className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Empty 
                  image={
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                      <CheckCircleOutlined className="w-8 h-8 text-gray-400" />
                    </div>
                  }
                  description={
                    <div className="text-center">
                      <p className="font-medium text-gray-600">No alerts</p>
                      <p className="text-sm text-gray-400">You're all caught up!</p>
                    </div>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertPanel;

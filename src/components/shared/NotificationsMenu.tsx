import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getNotifications, markNotificationRead, NotificationRow } from '@/lib/store';

export default function NotificationsMenu({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const data = await getNotifications(userId);
    setNotifications(data);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    // In a real app we might use Supabase realtime subscriptions here
    const interval = setInterval(fetchNotifications, 10000); // Polling for demo
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationRead(id);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await markNotificationRead(n.id);
    }
    fetchNotifications();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative w-10 h-10 rounded-xl hover:bg-white/10 transition-all">
          <Bell className="w-5 h-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-background animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 mt-2 glass-premium border-white/10 shadow-2xl rounded-2xl overflow-hidden" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
          <h4 className="font-black text-sm uppercase tracking-widest text-glow italic">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-auto p-1 text-[10px] text-muted-foreground hover:text-white uppercase font-black">
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs font-black text-muted-foreground uppercase opacity-50">
              No notifications yet
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-4 border-b border-white/5 transition-colors relative ${!notif.is_read ? 'bg-white/5' : 'opacity-70'}`}
              >
                {!notif.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                <div className="flex justify-between items-start mb-1">
                  <h5 className="font-black text-xs uppercase tracking-tight">{notif.title}</h5>
                  <span className="text-[9px] text-muted-foreground font-black opacity-50">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">{notif.message}</p>
                {!notif.is_read && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleMarkAsRead(notif.id)} 
                    className="mt-2 h-6 px-2 text-[10px] font-black uppercase text-primary hover:bg-primary/20 hover:text-primary"
                  >
                    <Check className="w-3 h-3 mr-1" /> Mark Read
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

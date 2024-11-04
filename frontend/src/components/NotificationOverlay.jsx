import { motion, AnimatePresence } from 'framer-motion';

export const NotificationOverlay = ({ notifications }) => {
  return (
    <AnimatePresence>
      {notifications.map(({ id, message, type }) => (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-md shadow-lg z-[100] ${
            type === 'kicked' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 
            type === 'muted' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
            type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
            'bg-blue-500/20 text-blue-400 border border-blue-500/20'
          }`}
        >
          {message}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};
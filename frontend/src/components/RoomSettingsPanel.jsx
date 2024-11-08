import { useEffect } from 'react';
import { Save } from 'lucide-react';

export const RoomSettingsPanel = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.settings-panel') && 
          !event.target.closest('.settings-button')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="settings-panel absolute right-4 top-16 w-64 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-4 z-50">
      <h3 className="text-lg font-medium mb-4">Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => onSettingsChange('theme', e.target.value)}
            className="w-full bg-gray-700/50 rounded-md p-2 border border-gray-600"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Font Size</label>
          <select
            value={settings.fontSize}
            onChange={(e) => onSettingsChange('fontSize', e.target.value)}
            className="w-full bg-gray-700/50 rounded-md p-2 border border-gray-600"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Editor Features</label>
          <div className="space-y-2">
            {[
              { id: 'lineNumbers', label: 'Line Numbers' },
              { id: 'wordWrap', label: 'Word Wrap' },
              { id: 'autoComplete', label: 'Auto-completion' },
            ].map((feature) => (
              <label key={feature.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings[feature.id]}
                  onChange={(e) => onSettingsChange(feature.id, e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm">{feature.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
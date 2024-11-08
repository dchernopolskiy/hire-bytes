import { useState } from 'react';
import { Settings, Monitor, Type, Code2, Clock, Download, Save, Share2 } from 'lucide-react';

export const RoomSettings = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onExportSession,
}) => {
  const [activeTab, setActiveTab] = useState('appearance');
  
  const themes = [
    { id: 'dark', name: 'Dark Theme' },
    { id: 'light', name: 'Light Theme' },
    { id: 'high-contrast', name: 'High Contrast' }
  ];

  const fontSizes = [
    { id: 'small', name: 'Small' },
    { id: 'medium', name: 'Medium' },
    { id: 'large', name: 'Large' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Room Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'appearance' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Appearance</span>
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'editor' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('session')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'session' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Session</span>
            </button>
          </div>

          <div className="space-y-6">
            {activeTab === 'appearance' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => onSettingsChange('theme', theme.id)}
                        className={`p-4 rounded-md border transition-colors ${
                          settings.theme === theme.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Font Size</label>
                  <div className="grid grid-cols-3 gap-4">
                    {fontSizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => onSettingsChange('fontSize', size.id)}
                        className={`p-4 rounded-md border transition-colors ${
                          settings.fontSize === size.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {size.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'editor' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Editor Features</label>
                  <div className="space-y-3">
                    {[
                      { id: 'autoComplete', label: 'Auto-completion' },
                      { id: 'lineNumbers', label: 'Line Numbers' },
                      { id: 'wordWrap', label: 'Word Wrap' },
                      { id: 'brackets', label: 'Auto Brackets' }
                    ].map((feature) => (
                      <label key={feature.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings[feature.id]}
                          onChange={(e) => onSettingsChange(feature.id, e.target.checked)}
                          className="rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500"
                        />
                        <span>{feature.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Indentation</label>
                  <select
                    value={settings.indentSize}
                    onChange={(e) => onSettingsChange('indentSize', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md p-2"
                  >
                    <option value="2">2 spaces</option>
                    <option value="4">4 spaces</option>
                    <option value="tab">Tab</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'session' && (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4">
                  <h3 className="text-blue-400 font-medium mb-2">Session Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span>{settings.sessionDuration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Participants:</span>
                      <span>{settings.participantCount}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={onExportSession}
                    className="flex items-center justify-center space-x-2 px-4 py-2 
                      bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Session</span>
                  </button>
                  <button
                    className="flex items-center justify-center space-x-2 px-4 py-2 
                      bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
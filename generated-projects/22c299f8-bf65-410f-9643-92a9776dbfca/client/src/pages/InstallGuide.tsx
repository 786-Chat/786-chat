import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Monitor, Download, Share, Menu, MoreVertical, Home } from 'lucide-react';

export default function InstallGuide() {
  const [selectedDevice, setSelectedDevice] = useState<'android' | 'iphone' | 'desktop'>('android');

  const deviceSteps = {
    android: [
      {
        icon: '🌐',
        title: 'Open in Chrome',
        description: 'Visit foodsafetyrating.live in Chrome browser'
      },
      {
        icon: '🔔',
        title: 'Install Prompt',
        description: 'Tap "Install" when the prompt appears at the bottom'
      },
      {
        icon: '📱',
        title: 'Alternative Method',
        description: 'Tap menu (⋮) → "Add to Home Screen" → "Install"'
      },
      {
        icon: '🏠',
        title: 'Done!',
        description: 'App icon appears on home screen'
      }
    ],
    iphone: [
      {
        icon: '🌐',
        title: 'Open in Safari',
        description: 'Visit foodsafetyrating.live in Safari browser'
      },
      {
        icon: '📤',
        title: 'Share Button',
        description: 'Tap the Share button at the bottom of Safari'
      },
      {
        icon: '➕',
        title: 'Add to Home Screen',
        description: 'Scroll and tap "Add to Home Screen"'
      },
      {
        icon: '✅',
        title: 'Confirm',
        description: 'Tap "Add" to install the app'
      }
    ],
    desktop: [
      {
        icon: '💻',
        title: 'Open Browser',
        description: 'Visit foodsafetyrating.live in Chrome, Edge, or Firefox'
      },
      {
        icon: '⬇️',
        title: 'Install Button',
        description: 'Click the install icon in the address bar'
      },
      {
        icon: '📋',
        title: 'Alternative',
        description: 'Menu → "Install Food Safety Rating"'
      },
      {
        icon: '🚀',
        title: 'Launch',
        description: 'App opens in its own window'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-yellow-400 to-green-400 p-3 rounded-xl">
              <Download className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Install Food Safety Rating App</h1>
          <p className="text-xl text-gray-300">Add to your device for quick access</p>
        </div>

        {/* Device Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800 p-1 rounded-lg flex gap-1">
            <Button
              variant={selectedDevice === 'android' ? 'default' : 'ghost'}
              onClick={() => setSelectedDevice('android')}
              className={`flex items-center gap-2 ${
                selectedDevice === 'android' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              Android
            </Button>
            <Button
              variant={selectedDevice === 'iphone' ? 'default' : 'ghost'}
              onClick={() => setSelectedDevice('iphone')}
              className={`flex items-center gap-2 ${
                selectedDevice === 'iphone' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              iPhone
            </Button>
            <Button
              variant={selectedDevice === 'desktop' ? 'default' : 'ghost'}
              onClick={() => setSelectedDevice('desktop')}
              className={`flex items-center gap-2 ${
                selectedDevice === 'desktop' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Monitor className="h-4 w-4" />
              Desktop
            </Button>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {deviceSteps[selectedDevice].map((step, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700">
              <CardHeader className="text-center pb-2">
                <div className="text-4xl mb-2">{step.icon}</div>
                <CardTitle className="text-lg text-white">
                  Step {index + 1}: {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-300 text-sm">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Visual Demo */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-center">Visual Guide</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDevice === 'android' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-slate-700 p-4 rounded-lg w-64">
                  <div className="bg-white rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm">foodsafetyrating.live</span>
                      </div>
                      <MoreVertical className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-400 to-green-400 text-black p-3 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Download className="h-4 w-4" />
                      <span className="font-bold text-sm">Install App</span>
                    </div>
                    <p className="text-xs">Add to home screen for quick access</p>
                    <Button size="sm" className="bg-black text-white mt-2">
                      Install
                    </Button>
                  </div>
                </div>
                <p className="text-gray-300 text-sm text-center">Tap "Install" when this appears</p>
              </div>
            )}

            {selectedDevice === 'iphone' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-slate-700 p-4 rounded-lg w-64">
                  <div className="bg-white rounded-lg p-3 mb-3">
                    <div className="text-center mb-2">
                      <span className="text-sm">foodsafetyrating.live</span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <Share className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm text-center">Tap Share button, then "Add to Home Screen"</p>
              </div>
            )}

            {selectedDevice === 'desktop' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-slate-700 p-4 rounded-lg w-96">
                  <div className="bg-white rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">foodsafetyrating.live</span>
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-500 p-1 rounded">
                          <Download className="h-3 w-3 text-white" />
                        </div>
                        <Menu className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm text-center">Click install icon in address bar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Why Install the App?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-400 to-yellow-400 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">Quick Access</h3>
                <p className="text-gray-300 text-sm">Launch directly from home screen</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-400 to-yellow-400 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-white font-bold">⚡</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Faster Loading</h3>
                <p className="text-gray-300 text-sm">Optimized performance</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-400 to-yellow-400 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-white font-bold">📱</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Native Feel</h3>
                <p className="text-gray-300 text-sm">Full-screen app experience</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Need help? Contact support at foodsafetyrating.live
          </p>
        </div>
      </div>
    </div>
  );
}
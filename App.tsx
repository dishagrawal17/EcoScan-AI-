
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Camera, 
  Leaf, 
  MapPin, 
  Award, 
  History, 
  Plus, 
  ArrowLeft, 
  Trash2, 
  Lightbulb, 
  ChevronRight,
  TrendingUp,
  Package,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { AppView, WasteAnalysis, UserStats, GroundingLink } from './types';
import { LOOPLABS_LOGO, REWARDS } from './constants';
import { analyzeWaste } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<WasteAnalysis | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<GroundingLink[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    points: 120,
    streak: 4,
    divertedWasteKg: 2.4,
    scansCount: 15
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const handleStartScan = () => {
    setView(AppView.SCAN);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Please enable camera access to scan waste items.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
        processImage(dataUrl);
      }
    }
  };

  const processImage = async (image: string) => {
    setLoading(true);
    try {
      const result = await analyzeWaste(image, location?.lat, location?.lng);
      setAnalysis(result.analysis);
      setGroundingLinks(result.groundingLinks);
      setView(AppView.RESULTS);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze image. Please try again.");
      setView(AppView.SCAN);
    } finally {
      setLoading(false);
    }
  };

  const awardPoints = (amount: number) => {
    setUserStats(prev => ({
      ...prev,
      points: prev.points + amount,
      scansCount: prev.scansCount + 1,
      divertedWasteKg: prev.divertedWasteKg + (Math.random() * 0.5)
    }));
    alert(`🎉 You earned ${amount} Green Points!`);
    setView(AppView.DASHBOARD);
  };

  const renderDashboard = () => (
    <div className="flex flex-col gap-6 pb-24">
      <div className="gradient-eco p-8 rounded-3xl text-white shadow-xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="opacity-80 text-sm font-medium">My Eco Points</p>
            <h1 className="text-4xl font-bold">{userStats.points}</h1>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl">
            <TrendingUp size={32} />
          </div>
        </div>
        <div className="flex gap-6 mt-2">
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{userStats.streak}</span>
            <span className="text-xs opacity-80 uppercase tracking-wider">Day Streak</span>
          </div>
          <div className="flex flex-col border-l border-white/20 pl-6">
            <span className="text-2xl font-bold">{userStats.divertedWasteKg.toFixed(1)}kg</span>
            <span className="text-xs opacity-80 uppercase tracking-wider">Waste Saved</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={handleStartScan}
          className="bg-white p-6 rounded-3xl shadow-sm border border-green-100 flex flex-col items-center gap-3 transition-transform active:scale-95"
        >
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <Camera size={28} />
          </div>
          <span className="font-semibold text-gray-800">Scan Item</span>
        </button>
        <button 
          onClick={() => setView(AppView.REWARDS)}
          className="bg-white p-6 rounded-3xl shadow-sm border border-green-100 flex flex-col items-center gap-3 transition-transform active:scale-95"
        >
          <div className="bg-amber-100 p-3 rounded-full text-amber-600">
            <Award size={28} />
          </div>
          <span className="font-semibold text-gray-800">Rewards</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-green-500/20">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Latest Scan Activity</h3>
        <div className="space-y-4">
          {[
            { name: 'PET Water Bottle', date: '2 hours ago', pts: '+15', icon: <Package className="text-blue-500" /> },
            { name: 'Cardboard Box', date: 'Yesterday', pts: '+10', icon: <Trash2 className="text-orange-500" /> }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
              <div className="p-2 bg-white rounded-xl shadow-sm">{item.icon}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500">{item.date}</p>
              </div>
              <span className="font-bold text-green-600">{item.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderScan = () => (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 bg-gray-900 overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Viewfinder overlay */}
        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
          <div className="w-full h-full border-2 border-white/50 rounded-3xl" />
        </div>

        <button 
          onClick={() => { stopCamera(); setView(AppView.DASHBOARD); }}
          className="absolute top-10 left-6 bg-white/20 backdrop-blur-md p-3 rounded-full text-white"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-6">
          <p className="text-white font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
            Point camera at waste item
          </p>
          <button 
            onClick={capturePhoto}
            className="w-20 h-20 bg-white rounded-full border-8 border-white/30 flex items-center justify-center transition-transform active:scale-90"
          >
            <div className="w-14 h-14 bg-green-500 rounded-full" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-10 text-center gap-6">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Analyzing Material...</h2>
            <p className="text-gray-400">Our AI is identifying chemical compounds and local recycling rules.</p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl text-xs space-y-2 w-full max-w-xs text-left">
            <div className="flex gap-2">🟢 Analyzing image features...</div>
            <div className="flex gap-2">🟢 Checking municipality database...</div>
            <div className="flex gap-2 animate-pulse">🟡 Generating eco-alternatives...</div>
          </div>
        </div>
      )}
    </div>
  );

  const renderResults = () => {
    if (!analysis) return null;
    return (
      <div className="flex flex-col gap-6 pb-24">
        <div className="flex items-center gap-4">
          <button onClick={() => setView(AppView.DASHBOARD)} className="p-2 bg-white rounded-full shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Analysis Results</h2>
        </div>

        <div className="relative rounded-3xl overflow-hidden shadow-lg h-48">
          <img src={capturedImage || ''} className="w-full h-full object-cover" alt="Captured" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <div className="text-white">
              <h3 className="text-2xl font-bold">{analysis.itemName}</h3>
              <p className="text-sm opacity-90">{analysis.material}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-3xl flex items-center gap-4 ${analysis.isRecyclable ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-orange-100 text-orange-800 border border-orange-200'}`}>
          <div className="bg-white p-3 rounded-2xl shadow-sm">
            {analysis.isRecyclable ? <CheckCircle2 size={24} className="text-green-600" /> : <Trash2 size={24} className="text-orange-600" />}
          </div>
          <div>
            <p className="font-bold">{analysis.isRecyclable ? 'Recyclable' : 'Hard to Recycle'}</p>
            <p className="text-sm opacity-80">{analysis.isRecyclable ? 'Follow bin rules below' : 'Consider DIY or special facility'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3 text-blue-600">
            <MapPin size={20} />
            <h4 className="font-bold">Local Municipality Rules</h4>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm">
            {analysis.municipalityRules}
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-500" />
            Upcycling & DIY Ideas
          </h4>
          <div className="grid gap-3">
            {analysis.upcyclingIdeas.map((idea, i) => (
              <div key={i} className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between group">
                <span className="text-sm text-amber-900 font-medium">{idea}</span>
                <ChevronRight size={18} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        </div>

        {groundingLinks.length > 0 && (
          <div className="bg-green-50 p-6 rounded-3xl border border-green-200">
            <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Nearby Facilities
            </h4>
            <div className="space-y-3">
              {groundingLinks.map((link, i) => (
                <a 
                  key={i} 
                  href={link.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block bg-white p-3 rounded-xl shadow-sm border border-green-100 hover:border-green-400 transition-colors"
                >
                  <p className="font-semibold text-green-800 text-sm truncate">{link.title}</p>
                  <p className="text-xs text-green-600">Open in Maps →</p>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-4">
          <button 
            onClick={() => awardPoints(analysis.isRecyclable ? 15 : 5)}
            className="gradient-eco text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-transform"
          >
            I Disposed This Properly (+{analysis.isRecyclable ? 15 : 5} pts)
          </button>
          <button 
            onClick={() => awardPoints(30)}
            className="bg-white border-2 border-green-500 text-green-600 py-4 rounded-2xl font-bold active:scale-95 transition-transform"
          >
            I Made a DIY Project (+30 pts)
          </button>
        </div>
      </div>
    );
  };

  const renderRewards = () => (
    <div className="flex flex-col gap-6 pb-24">
       <div className="flex items-center gap-4">
          <button onClick={() => setView(AppView.DASHBOARD)} className="p-2 bg-white rounded-full shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Eco Rewards</h2>
        </div>

        <div className="bg-amber-500 p-8 rounded-3xl text-white shadow-lg flex items-center justify-between">
          <div>
            <p className="opacity-80 text-sm uppercase">Available Points</p>
            <h3 className="text-4xl font-bold">{userStats.points}</h3>
          </div>
          <Award size={48} className="opacity-40" />
        </div>

        <div className="grid gap-4">
          {REWARDS.map(reward => (
            <div key={reward.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="text-4xl p-3 bg-gray-50 rounded-2xl">{reward.icon}</div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">{reward.name}</h4>
                <p className="text-xs text-gray-500 leading-tight mb-1">{reward.description}</p>
                <p className="text-sm font-bold text-amber-600">{reward.cost} pts</p>
              </div>
              <button 
                disabled={userStats.points < reward.cost}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${userStats.points >= reward.cost ? 'bg-green-600 text-white shadow-md shadow-green-100' : 'bg-gray-100 text-gray-400'}`}
              >
                Redeem
              </button>
            </div>
          ))}
        </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen relative px-6 pt-10">
      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-2">
          <div className="text-green-600">
            {LOOPLABS_LOGO("w-8 h-8")}
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">EcoScan <span className="text-green-600">AI</span></h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest -mt-1">by LoopLabs</p>
          </div>
        </div>
        <div className="bg-white p-2 rounded-full shadow-sm">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
            JD
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {view === AppView.DASHBOARD && renderDashboard()}
        {view === AppView.SCAN && renderScan()}
        {view === AppView.RESULTS && renderResults()}
        {view === AppView.REWARDS && renderRewards()}
      </main>

      {/* Persistent Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-6 pb-6 pt-2 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-full h-16 flex items-center justify-around px-2 pointer-events-auto">
          <button onClick={() => setView(AppView.DASHBOARD)} className={`p-3 rounded-full transition-colors ${view === AppView.DASHBOARD ? 'bg-green-600 text-white' : 'text-gray-400'}`}>
            <Leaf size={20} />
          </button>
          <button onClick={handleStartScan} className="bg-green-600 text-white p-4 rounded-full shadow-lg shadow-green-200 -mt-10 border-4 border-white transition-transform active:scale-95">
            <Camera size={24} />
          </button>
          <button onClick={() => setView(AppView.REWARDS)} className={`p-3 rounded-full transition-colors ${view === AppView.REWARDS ? 'bg-green-600 text-white' : 'text-gray-400'}`}>
            <Award size={20} />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;

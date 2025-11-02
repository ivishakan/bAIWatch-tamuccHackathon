
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { calculateScore, setChecklist } from '../store/store'
import Header from '../components/Header'
import ScoreCard from '../components/ScoreCard'

function AlertBanner() {
  return (
    <div className="bg-linear-to-r from-amber-500 to-orange-600 text-white px-6 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-bold text-sm">NOAA Weather Alert</div>
            <div className="text-sm opacity-95">Tropical Storm watch for Corpus Christi area. Monitor updates closely.</div>
          </div>
        </div>
        <button className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition">View Details</button>
      </div>
    </div>
  )
}

function HeroSection({ onStartWizard }) {
  return (
    <section className="relative py-20 px-6 text-center overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-700 to-purple-800 opacity-95"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="inline-block px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-100 text-sm font-medium mb-6 border border-emerald-400/30">
          🌀 AI-Powered Hurricane Preparedness
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 text-white drop-shadow-2xl leading-tight">
          Stay Safe.<br />Stay Prepared.
        </h1>
        <p className="max-w-3xl mx-auto text-xl md:text-2xl text-blue-50 mb-10 leading-relaxed">
          Get your personalized hurricane action plan in minutes. Our AI assistant analyzes your household, location, and needs to create custom evacuation routes, supply checklists, and real-time alerts.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button 
            onClick={onStartWizard}
            className="group px-8 py-4 bg-white text-indigo-700 font-bold rounded-xl shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <span>Start Your Plan</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
          <button className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold rounded-xl border-2 border-white/30 transition-all duration-300">
            Watch Demo
          </button>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/90 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            Real-time NOAA data
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            Multi-language support
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            SMS & Push alerts
          </div>
        </div>
      </div>
    </section>
  )
}

function StepWizard({ onComplete }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    zip: '',
    adults: 1,
    kids: 0,
    elderly: 0,
    pets: 0,
    medical: [],
    vehicle: true
  })

  const steps = [
    { id: 1, title: 'Location', icon: '📍' },
    { id: 2, title: 'Household', icon: '👨‍👩‍👧‍👦' },
    { id: 3, title: 'Medical', icon: '💊' },
    { id: 4, title: 'Transport', icon: '🚗' },
  ]

  function handleNext() {
    if (step < 4) setStep(step + 1)
    else onComplete(formData)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto border border-slate-200 dark:border-slate-700">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                step >= s.id ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                {s.icon}
              </div>
              <div className={`text-xs mt-2 font-medium ${step >= s.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                {s.title}
              </div>
            </div>
          ))}
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-linear-to-r from-indigo-500 to-purple-600 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>
      </div>

      <div className="min-h-[240px]">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2">What's your location?</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">We'll use this to find your evacuation zone and local shelters.</p>
            <input
              type="text"
              placeholder="Enter ZIP code"
              value={formData.zip}
              onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-indigo-500 focus:outline-none dark:bg-slate-700"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2">Tell us about your household</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">This helps us customize your supply checklist.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Adults</label>
                <input type="number" min="0" value={formData.adults} onChange={(e) => setFormData({ ...formData, adults: +e.target.value })} className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Children</label>
                <input type="number" min="0" value={formData.kids} onChange={(e) => setFormData({ ...formData, kids: +e.target.value })} className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Elderly</label>
                <input type="number" min="0" value={formData.elderly} onChange={(e) => setFormData({ ...formData, elderly: +e.target.value })} className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pets</label>
                <input type="number" min="0" value={formData.pets} onChange={(e) => setFormData({ ...formData, pets: +e.target.value })} className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2">Any medical needs?</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">Select all that apply to ensure proper planning.</p>
            <div className="space-y-3">
              {['Oxygen', 'Dialysis', 'Insulin', 'Daily medications', 'Mobility assistance'].map(item => (
                <label key={item} className="flex items-center gap-3 p-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg hover:border-indigo-400 cursor-pointer transition">
                  <input type="checkbox" className="w-5 h-5 accent-indigo-600" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2">Transportation</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">Do you have access to a vehicle for evacuation?</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border-2 border-slate-200 dark:border-slate-600 rounded-lg hover:border-indigo-400 cursor-pointer transition">
                <input type="radio" name="vehicle" checked={formData.vehicle} onChange={() => setFormData({ ...formData, vehicle: true })} className="w-5 h-5 accent-indigo-600" />
                <div>
                  <div className="font-semibold">Yes, I have a vehicle</div>
                  <div className="text-sm text-slate-500">We'll provide driving routes and fuel stations</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 border-slate-200 dark:border-slate-600 rounded-lg hover:border-indigo-400 cursor-pointer transition">
                <input type="radio" name="vehicle" checked={!formData.vehicle} onChange={() => setFormData({ ...formData, vehicle: false })} className="w-5 h-5 accent-indigo-600" />
                <div>
                  <div className="font-semibold">No vehicle available</div>
                  <div className="text-sm text-slate-500">We'll locate public transport and shelter options</div>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-6 py-2 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:text-indigo-600 transition"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all"
        >
          {step === 4 ? 'Generate Plan' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description, action }) {
  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1">
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">{description}</p>
      {action}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const score = useSelector((s) => s.preparedness.score)
  const [showWizard, setShowWizard] = useState(false)

  const seedChecklist = [
    '3-day water supply (1 gal/person/day)',
    '3-day medication supply',
    'Flashlights + batteries',
    'Portable phone chargers',
    'Important documents in waterproof bag',
    'Pet supplies',
    'Vehicle fuel',
    'Evacuation plan & routes',
  ]

  function handleWizardComplete(data) {
    console.log('Plan data:', data)
    dispatch(setChecklist(seedChecklist))
    dispatch(calculateScore())
    setShowWizard(false)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Header />
      <AlertBanner />
      
      {!showWizard ? (
        <>
          <HeroSection onStartWizard={() => setShowWizard(true)} />
          
          <main className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              <div className="lg:col-span-2 space-y-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  <FeatureCard
                    icon="🗺️"
                    title="Smart Evacuation Routes"
                    description="Real-time traffic, road closures, and safe routes based on your ZIP code and vehicle type."
                    action={<button onClick={() => navigate('/evacuation')} className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline">View Routes →</button>}
                  />
                  <FeatureCard
                    icon="📋"
                    title="Custom Checklist"
                    description="AI-generated supply list tailored to your household size, pets, and medical needs."
                    action={
                      <button
                        onClick={() => {
                          dispatch(setChecklist(seedChecklist))
                          dispatch(calculateScore())
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                      >
                        Generate Now
                      </button>
                    }
                  />
                  <FeatureCard
                    icon="🌊"
                    title="Flood Risk Analysis"
                    description="Historical flood zones, tide forecasts, and drainage capacity for your exact address."
                    action={<button className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline">Check Risk →</button>}
                  />
                  <FeatureCard
                    icon="📱"
                    title="Multi-Channel Alerts"
                    description="Timeline notifications (48h, 24h, 12h) via SMS, push, and voice in your language."
                    action={<button className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline">Enable Alerts →</button>}
                  />
                </div>

                <div className="bg-linear-to-br from-purple-600 to-indigo-700 text-white rounded-2xl p-8 shadow-xl">
                  <h3 className="text-2xl font-bold mb-3 flex items-center gap-3">
                    <span className="text-3xl">🤖</span> AI Assistant Chat
                  </h3>
                  <p className="text-purple-100 mb-6">Ask questions, get personalized advice, and receive instant answers about hurricane preparation.</p>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 space-y-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/20 shrink-0"></div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl rounded-tl-none px-4 py-3 text-sm">
                        Hi! I'm your AI prep assistant. What would you like to know?
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your question..."
                      className="flex-1 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:border-white/40"
                    />
                    <button className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-purple-50 transition">
                      Send
                    </button>
                  </div>
                </div>
              </div>

              <aside className="space-y-6">
                <ScoreCard score={score} />
                
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-100 dark:border-slate-700">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="text-xl">⚡</span> Quick Start
                  </h4>
                  <div className="space-y-3">
                    <button onClick={() => setShowWizard(true)} className="w-full text-left px-4 py-3 bg-linear-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                      1. Complete 2-min survey
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                      2. Connect location
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                      3. Enable notifications
                    </button>
                  </div>
                </div>

                <div className="bg-linear-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-lg">
                  <div className="text-4xl mb-3">🏆</div>
                  <h4 className="font-bold text-lg mb-2">Featured This Week</h4>
                  <p className="text-sm text-emerald-50">Learn how to prepare your home for hurricane season with our interactive guide.</p>
                  <button className="mt-4 w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition">
                    Start Guide
                  </button>
                </div>
              </aside>
            </div>
          </main>
        </>
      ) : (
        <div className="py-16 px-6">
          <button
            onClick={() => setShowWizard(false)}
            className="max-w-7xl mx-auto mb-6 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition flex items-center gap-2"
          >
            ← Back to home
          </button>
          <StepWizard onComplete={handleWizardComplete} />
        </div>
      )}
    </div>
  )
}

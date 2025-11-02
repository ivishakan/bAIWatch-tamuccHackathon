import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

export default function SOSButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [timeLeft, setTimeLeft] = useState(10)
  const [status, setStatus] = useState('Ready')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  const transcribedTextRef = useRef('')
  
  const userEmail = useSelector((s) => s.preparedness.notificationSettings?.email)
  const location = useSelector((s) => s.preparedness.location)

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          transcribedTextRef.current += finalTranscript
        }
        
        const displayText = transcribedTextRef.current + interimTranscript
        setTranscription(displayText || 'Listening...')
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        
        if (event.error === 'no-speech') {
          return // Continue listening
        } else if (event.error === 'audio-capture') {
          toast.error('No microphone found. Please check your microphone.')
          stopRecording()
        } else if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied. Please allow microphone access.')
          stopRecording()
        }
      }

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started')
        setStatus('Recording...')
      }

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended')
        if (isRecording && timeLeft > 0) {
          try {
            recognitionRef.current?.start()
          } catch (e) {
            console.log('Could not restart recognition:', e)
          }
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, timeLeft])

  const addPunctuation = (text) => {
    if (!text || text.trim().length === 0) return text
    
    let processed = text.trim()
    
    if (processed.length > 0) {
      processed = processed.charAt(0).toUpperCase() + processed.slice(1)
    }
    
    if (processed.length > 0 && !processed.match(/[.!?]$/)) {
      processed += '.'
    }
    
    return processed
  }

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser. Please use Chrome or Edge.')
      return
    }

    setIsRecording(true)
    setTimeLeft(10)
    setTranscription('Listening...')
    setStatus('Recording... Speak now!')
    transcribedTextRef.current = ''

    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('Error starting recognition:', error)
      toast.error('Could not start recording. Please try again.')
      stopRecording()
      return
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopRecording()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    setIsRecording(false)
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log('Recognition already stopped')
      }
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (transcribedTextRef.current.trim()) {
      const finalText = addPunctuation(transcribedTextRef.current)
      setTranscription(finalText)
      makeEmergencyCall(finalText)
    } else {
      setStatus('No speech detected')
      toast.warning('No speech detected. Please try again.')
      setTimeout(() => setStatus('Ready'), 2000)
    }
  }

  const makeEmergencyCall = async (message) => {
    setIsProcessing(true)
    setStatus('Initiating emergency call...')

    try {
      const userId = userEmail ? userEmail.split('@')[0] : 'user1'
      
      const response = await fetch('http://localhost:3000/api/make-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          transcribedMessage: message,
          phoneNumber: process.env.REACT_APP_EMERGENCY_PHONE || '+13614259843'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('Emergency call initiated!')
        toast.success(`Emergency call initiated! Call ID: ${data.callSid}`)
        console.log('Emergency call details:', data)
      } else {
        throw new Error(data.error || 'Failed to make call')
      }
    } catch (error) {
      console.error('Error making emergency call:', error)
      setStatus('Failed to initiate call')
      toast.error(`Failed to initiate emergency call: ${error.message}`)
    } finally {
      setIsProcessing(false)
      setTimeout(() => {
        setStatus('Ready')
        setTranscription('')
        setIsOpen(false)
      }, 5000)
    }
  }

  const handleSOSClick = async () => {
    // Request microphone access when SOS is clicked
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setIsOpen(true)
      setTranscription('')
      setStatus('Ready to record')
      transcribedTextRef.current = ''
      toast.success('Microphone access granted')
    } catch (error) {
      console.error('Microphone access denied:', error)
      toast.error('Microphone access is required for emergency SOS. Please allow microphone access in your browser settings.')
    }
  }

  const handleStartRecording = () => {
    if (isRecording) {
      stopRecording()
    } else if (!isProcessing) {
      startRecording()
    }
  }

  const handleCloseModal = () => {
    if (isRecording) {
      stopRecording()
    }
    setIsOpen(false)
    setTranscription('')
    setStatus('Ready')
  }

  return (
    <>
      {/* SOS Button in Top Right */}
      <button
        onClick={handleSOSClick}
        className="fixed top-6 right-6 z-50 group"
        title="Emergency SOS - Voice Alert"
      >
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
          <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse"></span>
          
          <div className="relative bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center gap-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
            <span className="text-lg font-black">EMERGENCY SOS</span>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </button>

      {/* SOS Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ zIndex: 60 }}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border-4 border-red-500 animate-scale-in">
            <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black">EMERGENCY SOS</h2>
                  <p className="text-sm text-red-100">Voice-activated emergency alert</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-10 h-10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center"
                disabled={isRecording || isProcessing}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Status:</span>
                  {isRecording && (
                    <div className="flex items-center gap-2 text-red-600 font-bold">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span>RECORDING</span>
                      <span className="text-3xl font-black ml-2">{timeLeft}s</span>
                    </div>
                  )}
                </div>
                <div className={`text-lg font-semibold ${
                  isRecording ? 'text-red-600' : 
                  isProcessing ? 'text-blue-600' : 
                  'text-slate-700 dark:text-slate-300'
                }`}>
                  {status}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 mb-6 min-h-[200px] border-2 border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Transcription
                  </h3>
                  {isRecording && (
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>
                <div className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                  {transcription || (
                    <span className="text-slate-400 dark:text-slate-500 italic">
                      {isRecording ? 'Listening... Speak now!' : 'Press the button below to start recording your emergency message'}
                    </span>
                  )}
                </div>
              </div>

              {!isRecording && !isProcessing && !transcription && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      <p className="font-semibold mb-1">How it works:</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Click "Start Recording" button</li>
                        <li>Speak clearly describing your emergency (10 seconds)</li>
                        <li>System will transcribe your voice to text in real-time</li>
                        <li>Emergency call will be automatically placed</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleStartRecording}
                  disabled={isProcessing}
                  className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                      : 'bg-red-500 hover:bg-red-700 text-white'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : isRecording ? (
                    <>
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                      STOP RECORDING
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      START RECORDING
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleCloseModal}
                  disabled={isRecording || isProcessing}
                  className="px-6 py-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

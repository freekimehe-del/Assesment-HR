import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Sparkles, 
  Code, 
  Bot, 
  User, 
  CheckCircle, 
  Award,
  BookOpen
} from "lucide-react";
import { AssessmentAttempt } from "../types";

interface MockInterviewModalProps {
  attemptId: string;
  onClose: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function MockInterviewModal({ attemptId, onClose }: MockInterviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [codingTitle, setCodingTitle] = useState("");
  const [codingPrompt, setCodingPrompt] = useState("");
  const [candidateCode, setCandidateCode] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText) {
          setInput(prev => prev ? prev + " " + resultText : resultText);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Speak text aloud if voice is enabled
  const speak = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    // Stop any existing speech
    window.speechSynthesis.cancel();
    
    // Clean text of markdown accents for cleaner pronunciation
    const cleanText = text
      .replace(/[*#`_\-]/g, "")
      .replace(/Strengths Observed:/gi, "Technical Strengths Observed:")
      .replace(/Growth Recommendations:/gi, "Growth Recommendations:");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Fetch initial question
  useEffect(() => {
    const startInterview = async () => {
      try {
        const res = await fetch("/api/assessment/interview/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId })
        });
        const data = await res.json();
        
        if (res.ok) {
          setCodingTitle(data.codingQuestionTitle);
          setCodingPrompt(data.codingQuestionPrompt);
          setCandidateCode(data.candidateCode);
          
          const initialMsgs: Message[] = [
            { role: "assistant", content: `${data.introduction}\n\n${data.question}` }
          ];
          setMessages(initialMsgs);
          speak(data.question);
        } else {
          alert(data.error || "Failed to initialize interview.");
          onClose();
        }
      } catch (err) {
        console.error("Failed to start mock interview:", err);
        alert("An error occurred starting the interview.");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    startInterview();

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [attemptId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    const updatedHistory = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(updatedHistory);

    setSending(true);

    try {
      const res = await fetch("/api/assessment/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          chatHistory: updatedHistory
        })
      });
      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        speak(data.reply);
        if (data.completed) {
          setInterviewComplete(true);
        }
      } else {
        alert(data.error || "An error occurred during communication.");
      }
    } catch (err) {
      console.error("Interview message send error:", err);
    } finally {
      setSending(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleVoiceToggle = () => {
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    if (!newVal && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const getQuestionTurnCount = () => {
    const userMsgs = messages.filter(m => m.role === "user").length;
    return Math.min(3, userMsgs + 1);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="mock-interview-backdrop">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200" id="mock-interview-container">
        
        {/* Header section */}
        <header className="px-6 py-4 border-b border-slate-250 bg-slate-50 flex items-center justify-between" id="mock-interview-header">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 border border-indigo-250 text-indigo-700 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>AI Technical Mock Interview</span>
                <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-250 text-emerald-800 text-[9px] font-bold rounded-full font-mono">
                  Live Follow-up
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">Discuss decisions, complexity, and performance edge cases.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TTS Audio Controls */}
            <button
              onClick={handleVoiceToggle}
              className={`p-2 rounded-lg border transition ${
                voiceEnabled 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100" 
                  : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200"
              }`}
              title={voiceEnabled ? "Mute Interviewer Voice Output" : "Enable Interviewer Voice Output"}
              id="voice-output-toggle-btn"
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg border border-transparent hover:border-slate-200 transition"
              id="close-mock-interview-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center space-y-4" id="mock-interview-loader">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="font-bold text-slate-700 text-xs">Preparing your AI Technical Interviewer...</p>
              <p className="text-[11px] text-slate-400 mt-1">Analyzing your code structure, test case coverage, and algorithmic patterns...</p>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col md:flex-row overflow-hidden" id="mock-interview-body">
            
            {/* Left side: Code and challenge specifications */}
            <section className="w-full md:w-1/2 border-r border-slate-200 flex flex-col h-full bg-slate-50" id="interview-code-review-pane">
              {/* Challenge description */}
              <div className="p-4 bg-white border-b border-slate-200 space-y-2 overflow-y-auto max-h-[35%]" id="interview-task-box">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Coding Assignment Spec: {codingTitle}</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed font-sans whitespace-pre-wrap">
                  {codingPrompt}
                </p>
              </div>

              {/* Code display */}
              <div className="flex-grow flex flex-col overflow-hidden" id="interview-code-display-box">
                <div className="bg-slate-900 px-4 py-1.5 text-slate-400 font-mono text-[10px] uppercase tracking-wider flex items-center justify-between">
                  <span>Your Submitted Solution</span>
                  <Code className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <pre className="flex-grow p-4 bg-slate-950 text-indigo-300 font-mono text-xs overflow-auto leading-relaxed select-text whitespace-pre">
                  <code>{candidateCode || "// No solution was provided during the sandbox phase."}</code>
                </pre>
              </div>
            </section>

            {/* Right side: Chat interface */}
            <section className="w-full md:w-1/2 flex flex-col h-full bg-white relative" id="interview-chat-pane">
              
              {/* Progress counter */}
              {!interviewComplete && (
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-[10px]" id="interview-progress-bar">
                  <span className="font-bold uppercase tracking-wider text-slate-500">Session Progress</span>
                  <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md font-mono">
                    Question {getQuestionTurnCount()} of 3
                  </span>
                </div>
              )}

              {/* Message scroll area */}
              <div className="flex-grow p-4 overflow-y-auto space-y-4" id="interview-messages-list">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-[88%] ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                    id={`msg-${idx}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      m.role === "user" 
                        ? "bg-slate-200 text-slate-700" 
                        : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    }`}>
                      {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={`rounded-2xl p-3.5 text-xs shadow-3xs leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                
                {sending && (
                  <div className="flex gap-3 max-w-[85%]" id="interviewer-typing-indicator">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-tl-none p-3.5 border border-slate-200 text-xs flex items-center gap-1.5 shadow-3xs">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      <span className="text-[10px] font-mono ml-1 font-semibold">Gemini is evaluating your answer...</span>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              {interviewComplete ? (
                <div className="p-5 border-t border-slate-200 bg-emerald-50/40 space-y-3.5 flex flex-col justify-center items-center text-center animate-fade-in" id="interview-completed-banner">
                  <div className="w-10 h-10 bg-emerald-100 border border-emerald-250 text-emerald-700 rounded-full flex items-center justify-center shadow-2xs">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Follow-up Technical Interview Completed!</h4>
                    <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed mt-1">
                      Excellent work discussing your implementation strategy and complexity limits. Your feedback and transcript have been synced to the database.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-2xs cursor-pointer"
                    id="exit-interview-btn"
                  >
                    Return to Dashboard
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSend} className="p-3 border-t border-slate-250 bg-slate-50 flex gap-2 items-center" id="interview-input-form">
                  {/* Microphone control */}
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`p-2.5 rounded-xl border transition flex-shrink-0 cursor-pointer ${
                        isListening 
                          ? "bg-rose-500 border-rose-600 text-white animate-pulse" 
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-3xs"
                      }`}
                      title={isListening ? "Stop listening" : "Speak your answer (Speech-to-Text)"}
                      id="voice-input-toggle-btn"
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening... Speak clearly..." : "Explain your implementation choice here..."}
                    className="flex-grow bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-950 outline-none transition shadow-2xs"
                    disabled={sending}
                    id="interview-text-input"
                  />

                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="p-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl transition flex-shrink-0 shadow-xs cursor-pointer disabled:opacity-40"
                    id="interview-submit-btn"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Tiny Speech Warning Banner */}
              {isListening && (
                <div className="absolute bottom-16 left-4 right-4 bg-rose-500 text-white px-3.5 py-2 rounded-xl text-[10px] font-mono flex items-center gap-2 shadow-md animate-bounce" id="mic-status-bubble">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span className="font-bold uppercase">Microphone Active</span>
                  <span>- Speak now. Click mic button to insert response text.</span>
                </div>
              )}
            </section>

          </div>
        )}

      </div>
    </div>
  );
}

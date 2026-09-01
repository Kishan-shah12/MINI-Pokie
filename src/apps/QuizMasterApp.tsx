import React, { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  HelpCircle,
  Sparkles,
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Flame,
  ArrowRight,
  Loader2,
  BookOpen,
  PlusCircle,
  Lightbulb,
} from "lucide-react";
import { QuizQuestion, QuizSet } from "../types";

// Built-in starter question decks
const PRESET_DECKS: Record<string, QuizSet> = {
  tech: {
    topic: "Web & Modern Technology",
    questions: [
      {
        id: 1,
        question: "What does the 'S' in HTTPS stand for?",
        options: ["Standard", "Secure", "Socket", "Synchronous"],
        correctIndex: 1,
        explanation: "HTTPS stands for Hypertext Transfer Protocol Secure, which encrypts web traffic using TLS/SSL.",
      },
      {
        id: 2,
        question: "Which data structure uses the LIFO (Last In, First Out) principle?",
        options: ["Queue", "Stack", "Binary Tree", "Hash Map"],
        correctIndex: 1,
        explanation: "A Stack adds and removes elements from the same end, following the Last-In-First-Out model.",
      },
      {
        id: 3,
        question: "What is the standard HTTP response status code for 'Not Found'?",
        options: ["200", "401", "404", "500"],
        correctIndex: 2,
        explanation: "Status code 404 indicates that the server cannot locate the requested resource.",
      },
      {
        id: 4,
        question: "Which of the following is a CSS-in-JS library or utility framework?",
        options: ["PostgreSQL", "Tailwind CSS", "Redis", "Nginx"],
        correctIndex: 1,
        explanation: "Tailwind CSS is a utility-first CSS framework for rapid UI styling.",
      },
      {
        id: 5,
        question: "In JavaScript, what will `typeof NaN` evaluate to?",
        options: ["undefined", "number", "NaN", "object"],
        correctIndex: 1,
        explanation: "In JavaScript specifications, NaN (Not a Number) is technically categorized under the 'number' type.",
      },
    ],
  },
  science: {
    topic: "Science & Nature",
    questions: [
      {
        id: 1,
        question: "What is the most abundant chemical element in the observable universe?",
        options: ["Oxygen", "Carbon", "Hydrogen", "Helium"],
        correctIndex: 2,
        explanation: "Hydrogen accounts for roughly 75% of the baryonic mass of the universe.",
      },
      {
        id: 2,
        question: "Which planet in our solar system has the highest surface temperature?",
        options: ["Mercury", "Venus", "Mars", "Jupiter"],
        correctIndex: 1,
        explanation: "Venus is hotter than Mercury due to its runaway greenhouse effect trapping heat.",
      },
      {
        id: 3,
        question: "What powerhouse organelle generates most of the chemical energy in eukaryotic cells?",
        options: ["Ribosome", "Golgi Apparatus", "Mitochondria", "Nucleus"],
        correctIndex: 2,
        explanation: "Mitochondria produce adenosine triphosphate (ATP), the primary energy currency of cells.",
      },
      {
        id: 4,
        question: "What is the approximate speed of light in a vacuum?",
        options: ["300,000 km/s", "150,000 km/s", "30,000 km/s", "1,000,000 km/s"],
        correctIndex: 0,
        explanation: "The speed of light in a vacuum is approximately 299,792 kilometers per second (~300,000 km/s).",
      },
      {
        id: 5,
        question: "Which gas do plants primarily absorb during the light-independent reactions of photosynthesis?",
        options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Methane"],
        correctIndex: 1,
        explanation: "Plants take in Carbon Dioxide (CO2) from the air to fix carbon into sugars.",
      },
    ],
  },
  history: {
    topic: "World History & Explorations",
    questions: [
      {
        id: 1,
        question: "In which year did the World Wide Web become publicly available to anyone outside CERN?",
        options: ["1985", "1991", "1995", "2000"],
        correctIndex: 1,
        explanation: "Tim Berners-Lee announced the World Wide Web project publicly in August 1991.",
      },
      {
        id: 2,
        question: "Which ancient civilization constructed Machu Picchu in the Andes mountains?",
        options: ["Aztecs", "Mayans", "Incas", "Olmecs"],
        correctIndex: 2,
        explanation: "Machu Picchu was built by the Inca Empire around the 15th century in modern-day Peru.",
      },
      {
        id: 3,
        question: "Who was the first person to travel into outer space in 1961?",
        options: ["Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "John Glenn"],
        correctIndex: 1,
        explanation: "Yuri Gagarin completed an orbit of the Earth aboard Vostok 1 on April 12, 1961.",
      },
      {
        id: 4,
        question: "What year did the Apollo 11 moon landing occur?",
        options: ["1965", "1969", "1972", "1975"],
        correctIndex: 1,
        explanation: "Apollo 11 landed humans on the Moon on July 20, 1969.",
      },
      {
        id: 5,
        question: "What famous trade route historically linked China to the Mediterranean world?",
        options: ["The Silk Road", "The Amber Route", "The Royal Road", "The Spice Passage"],
        correctIndex: 0,
        explanation: "The Silk Road was an ancient network of Eurasian trade routes.",
      },
    ],
  },
};

export const QuizMasterApp: React.FC = () => {
  const [activeDeckKey, setActiveDeckKey] = useState<string>("tech");
  const [currentQuiz, setCurrentQuiz] = useState<QuizSet>(PRESET_DECKS.tech);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ questionId: number; selected: number; correct: boolean }[]>([]);

  // AI Quiz Generator states
  const [customTopic, setCustomTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Timer per question (optional 15s)
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerActive, setTimerActive] = useState(true);

  const currentQ = currentQuiz.questions[currentIndex];

  // Timer countdown
  useEffect(() => {
    if (!timerActive || isAnswered || quizFinished) return;

    if (timeLeft <= 0) {
      handleAnswer(-1); // Timeout
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, timerActive, isAnswered, quizFinished]);

  const handleSelectPreset = (key: string) => {
    setActiveDeckKey(key);
    setCurrentQuiz(PRESET_DECKS[key]);
    resetQuiz(PRESET_DECKS[key]);
  };

  const resetQuiz = (quizSet: QuizSet = currentQuiz) => {
    setCurrentQuiz(quizSet);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setQuizFinished(false);
    setUserAnswers([]);
    setTimeLeft(20);
  };

  const handleAnswer = (optionIdx: number) => {
    if (isAnswered) return;

    setSelectedOption(optionIdx);
    setIsAnswered(true);

    const isCorrect = optionIdx === currentQ.correctIndex;
    const answerRecord = {
      questionId: currentQ.id,
      selected: optionIdx,
      correct: isCorrect,
    };
    setUserAnswers((prev) => [...prev, answerRecord]);

    if (isCorrect) {
      const addedPoints = 100 + streak * 20 + Math.max(0, timeLeft * 2);
      setScore((prev) => prev + addedPoints);
      setStreak((prev) => {
        const nextStreak = prev + 1;
        if (nextStreak > bestStreak) setBestStreak(nextStreak);
        return nextStreak;
      });
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < currentQuiz.questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(20);
    } else {
      setQuizFinished(true);
      if (score > 250) {
        try {
          confetti({
            particleCount: 80,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    }
  };

  // Generate Custom AI Quiz
  const handleGenerateAiQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const topic = customTopic.trim();
    if (!topic) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/ai/quiz-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count: 5 }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate AI quiz.");
      }

      const data = await res.json();
      if (data.quiz && Array.isArray(data.quiz.questions) && data.quiz.questions.length > 0) {
        const newQuiz: QuizSet = {
          topic: data.quiz.topic || topic,
          questions: data.quiz.questions,
        };
        setShowAiModal(false);
        setActiveDeckKey("custom-ai");
        resetQuiz(newQuiz);
      } else {
        throw new Error("Invalid quiz structure returned from AI.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Could not generate quiz. Please check network or retry.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div id="quiz-master-app" className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Topic Selector */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-500" />
            Quiz Master & Trivia Arena
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Test your knowledge across standard decks or generate custom quizzes with Gemini AI!
          </p>
        </div>

        {/* Deck Picker Tabs + AI Custom Button */}
        <div className="flex items-center flex-wrap gap-2">
          {Object.entries(PRESET_DECKS).map(([key, deck]) => (
            <button
              key={key}
              onClick={() => handleSelectPreset(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeDeckKey === key
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {deck.topic.split(" ")[0]}
            </button>
          ))}

          <button
            id="quiz-ai-modal-btn"
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Custom Quiz
          </button>
        </div>
      </div>

      {/* AI Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Generate Custom AI Quiz
              </h3>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type any topic—from <em>"Quantum Physics"</em> to <em>"Retro 90s Cartoons"</em>—and Gemini will construct a 5-question trivia challenge.
            </p>

            <form onSubmit={handleGenerateAiQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Quiz Topic or Subject
                </label>
                <input
                  id="quiz-custom-topic-input"
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Marvel Cinematic Universe, Space Travel, Python Async"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={aiLoading}
                  required
                />
              </div>

              {aiError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-600 dark:text-rose-300">
                  {aiError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  disabled={aiLoading}
                >
                  Cancel
                </button>
                <button
                  id="quiz-submit-ai-btn"
                  type="submit"
                  disabled={aiLoading || !customTopic.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating Deck...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Create Deck
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Quiz View */}
      {!quizFinished ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Progress & Stat Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-800">
                Question {currentIndex + 1} of {currentQuiz.questions.length}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Topic: <strong className="text-slate-800 dark:text-slate-200">{currentQuiz.topic}</strong>
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Streak */}
              {streak > 1 && (
                <span className="flex items-center gap-1 text-xs font-bold text-orange-500 animate-pulse">
                  <Flame className="w-4 h-4 fill-current" /> {streak}x Streak!
                </span>
              )}

              {/* Timer */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold ${
                timeLeft <= 5 ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}>
                <Clock className="w-3.5 h-3.5" /> {timeLeft}s
              </div>

              {/* Score */}
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {score} pts
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / currentQuiz.questions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="py-2">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3">
            {currentQ.options.map((option, idx) => {
              let optionStyle = "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500";

              if (isAnswered) {
                if (idx === currentQ.correctIndex) {
                  optionStyle = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold";
                } else if (idx === selectedOption) {
                  optionStyle = "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200";
                } else {
                  optionStyle = "opacity-50 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400";
                }
              }

              return (
                <button
                  key={idx}
                  id={`quiz-option-${idx}`}
                  onClick={() => handleAnswer(idx)}
                  disabled={isAnswered}
                  className={`w-full p-4 text-left rounded-2xl border text-sm font-medium transition flex items-center justify-between gap-3 shadow-xs ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-2xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>

                  {isAnswered && idx === currentQ.correctIndex && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  )}
                  {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Answer Explanation & Next Question Button */}
          {isAnswered && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong>Explanation:</strong> {currentQ.explanation}
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  id="quiz-next-btn"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {currentIndex + 1 < currentQuiz.questions.length ? "Next Question" : "See Final Score"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results Screen */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-slate-400">Quiz Completed</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              Final Score: {score} pts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You answered {userAnswers.filter((a) => a.correct).length} of {currentQuiz.questions.length} questions correctly! (Peak streak: {bestStreak}x)
            </p>
          </div>

          {/* Quick Review Summary */}
          <div className="max-w-md mx-auto space-y-2 text-left">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Question Breakdown
            </h4>
            {currentQuiz.questions.map((q, idx) => {
              const ans = userAnswers.find((a) => a.questionId === q.id);
              const correct = ans?.correct;
              return (
                <div
                  key={q.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <span className="truncate pr-2 text-slate-800 dark:text-slate-200">
                    {idx + 1}. {q.question}
                  </span>
                  {correct ? (
                    <span className="text-emerald-500 font-bold shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Correct
                    </span>
                  ) : (
                    <span className="text-rose-500 font-bold shrink-0 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Missed
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => resetQuiz()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <RotateCcw className="w-4 h-4" /> Retake This Quiz
            </button>
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Sparkles className="w-4 h-4" /> Try AI Custom Topic
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

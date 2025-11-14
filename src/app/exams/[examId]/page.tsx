"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getExamContent,
  submitExam,
} from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";

type ExamQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
};

type Exam = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  questions: ExamQuestion[];
};

type ExamResult = {
  examId: string;
  title: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: string;
};

export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.examId as string;
  const storedAuth = getStoredAuth();
  const token = storedAuth?.token ?? null;
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [examStarted, setExamStarted] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    if (!examId) {
      router.push("/exams");
      return;
    }

    const loadExam = async () => {
      try {
        const examData = await getExamContent(token, examId) as Exam;
        setExam(examData);
        setTimeLeft(examData.duration * 60); // Convert minutes to seconds
      } catch (err) {
        if (err instanceof Error && err.message.includes("purchase")) {
          setError("يجب شراء هذا الاختبار أولاً للوصول إليه.");
          setTimeout(() => router.push("/exams"), 3000);
        } else {
          setError(err instanceof Error ? err.message : "حدث خطأ في تحميل الاختبار");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadExam();
  }, [token, examId, router]);

  // Timer effect
  useEffect(() => {
    if (!examStarted || timeLeft <= 0 || result) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeLeft, result]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!token || !exam) return;

    try {
      setSubmitting(true);
      setError(null);

      const examResult = await submitExam(token, examId, answers) as ExamResult;
      setResult(examResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في إرسال الاختبار");
    } finally {
      setSubmitting(false);
    }
  };

  const startExam = () => {
    setExamStarted(true);
  };

  if (!token) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">جاري تحميل الاختبار...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-600 mb-4">
            {error}
          </div>
          <Link
            href="/exams"
            className="inline-block rounded-full bg-secondary-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-secondary-500"
          >
            العودة إلى الاختبارات
          </Link>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">لم يتم العثور على الاختبار</p>
          <Link
            href="/exams"
            className="inline-block mt-4 rounded-full bg-secondary-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-secondary-500"
          >
            العودة إلى الاختبارات
          </Link>
        </div>
      </div>
    );
  }

  // Show result page
  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="section-container max-w-2xl mx-auto">
          <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-xl text-center">
            <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full mb-6 ${
              result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
            }`}>
              {result.passed ? '✓' : '✗'}
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {result.title}
            </h1>
            
            <div className={`text-4xl font-bold mb-4 ${
              result.passed ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {result.score}%
            </div>
            
            <p className="text-slate-600 mb-6">
              أجبت على {result.correctAnswers} من {result.totalQuestions} أسئلة بشكل صحيح
            </p>
            
            <div className={`rounded-2xl p-4 mb-6 ${
              result.passed ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              {result.passed ? 'مبروك! لقد نجحت في الاختبار' : 'لم تحقق الدرجة المطلوبة للنجاح (70%)'}
            </div>
            
            <div className="flex gap-4 justify-center">
              <Link
                href="/exams"
                className="rounded-full bg-secondary-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-secondary-500"
              >
                العودة إلى الاختبارات
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-secondary-200 px-6 py-2 text-sm font-medium text-secondary-700 transition hover:bg-secondary-50"
              >
                لوحة التحكم
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show exam start page
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="section-container max-w-2xl mx-auto">
          <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              {exam.title}
            </h1>
            
            <p className="text-slate-600 mb-6">
              {exam.description}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <div className="text-2xl font-bold text-secondary-600">
                  {exam.questions.length}
                </div>
                <div className="text-sm text-slate-600">سؤال</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <div className="text-2xl font-bold text-secondary-600">
                  {exam.duration}
                </div>
                <div className="text-sm text-slate-600">دقيقة</div>
              </div>
            </div>
            
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 mb-6">
              <h3 className="font-semibold text-amber-800 mb-2">تعليمات مهمة:</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• لديك {exam.duration} دقيقة لإكمال الاختبار</li>
                <li>• لا يمكن العودة إلى الأسئلة السابقة بعد الإجابة عليها</li>
                <li>• تحتاج إلى 70% للنجاح في الاختبار</li>
                <li>• تأكد من اتصالك بالإنترنت قبل البدء</li>
              </ul>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={startExam}
                className="rounded-full bg-secondary-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-secondary-500"
              >
                بدء الاختبار
              </button>
              <Link
                href="/exams"
                className="rounded-full border border-secondary-200 px-8 py-3 text-sm font-medium text-secondary-700 transition hover:bg-secondary-50"
              >
                إلغاء
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show exam questions
  const answeredQuestions = Object.keys(answers).length;
  const progress = (answeredQuestions / exam.questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="section-container max-w-4xl mx-auto">
        {/* Header with timer and progress */}
        <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{exam.title}</h1>
              <p className="text-sm text-slate-600">
                السؤال {answeredQuestions} من {exam.questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                timeLeft < 300 ? 'text-rose-600' : 'text-secondary-600'
              }`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-sm text-slate-600">الوقت المتبقي</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-secondary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {exam.questions.map((question, index) => (
            <div
              key={question.id}
              className="rounded-3xl border border-white/60 bg-white p-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {index + 1}. {question.question}
              </h3>
              
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className={`flex items-center p-4 rounded-2xl border cursor-pointer transition ${
                      answers[question.id] === optionIndex
                        ? 'border-secondary-300 bg-secondary-50'
                        : 'border-slate-200 hover:border-secondary-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={optionIndex}
                      checked={answers[question.id] === optionIndex}
                      onChange={() => handleAnswerChange(question.id, optionIndex)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      answers[question.id] === optionIndex
                        ? 'border-secondary-600 bg-secondary-600'
                        : 'border-slate-300'
                    }`}>
                      {answers[question.id] === optionIndex && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit button */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || answeredQuestions < exam.questions.length}
            className="rounded-full bg-secondary-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-secondary-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "جاري الإرسال..." : "إرسال الاختبار"}
          </button>
          
          {answeredQuestions < exam.questions.length && (
            <p className="text-sm text-slate-600 mt-2">
              يجب الإجابة على جميع الأسئلة قبل الإرسال
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

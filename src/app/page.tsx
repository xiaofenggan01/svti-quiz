"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import {
  QUIZ_QUESTIONS,
  calculateQuizScores,
  calcSVTI,
} from "@/lib/quiz-data";
import type { AxisKey } from "@/lib/quiz-data";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TOTAL = QUIZ_QUESTIONS.length;

const AXES_META: { key: AxisKey; label: string; left: string; right: string }[] = [
  { key: "initiative", label: "行动域", left: "宅家驻守", right: "满地图探索" },
  { key: "game_style", label: "价值观", left: "搞钱效率", right: "情感体验" },
  { key: "speech_style", label: "专注度", left: "死磕秩序", right: "随机整活" },
];

type Phase = "start" | "quiz" | "result";

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function SVTIQuizPage() {
  const [phase, setPhase] = useState<Phase>("start");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(TOTAL).fill(-1));
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [animKey, setAnimKey] = useState(0);
  const busyRef = useRef(false);

  const startQuiz = useCallback(() => {
    setAnswers(new Array(TOTAL).fill(-1));
    setCurrentQ(0);
    busyRef.current = false;
    setPhase("quiz");
  }, []);

  const selectOption = useCallback(
    (optionIdx: number) => {
      if (busyRef.current) return;
      busyRef.current = true;

      setAnswers((prev) => {
        const next = [...prev];
        next[currentQ] = optionIdx;
        return next;
      });

      if (currentQ < TOTAL - 1) {
        setTimeout(() => {
          setSlideDir(1);
          setAnimKey((k) => k + 1);
          setCurrentQ((q) => q + 1);
          busyRef.current = false;
        }, 300);
      } else {
        setTimeout(() => setPhase("result"), 400);
      }
    },
    [currentQ],
  );

  const goBack = useCallback(() => {
    if (currentQ > 0) {
      setSlideDir(-1);
      setAnimKey((k) => k + 1);
      setCurrentQ((q) => q - 1);
      busyRef.current = false;
    }
  }, [currentQ]);

  const scores = useMemo(() => {
    if (phase !== "result") return null;
    return calculateQuizScores(answers);
  }, [answers, phase]);

  const svtiType = useMemo(() => {
    if (!scores) return null;
    return calcSVTI(scores);
  }, [scores]);

  const restart = useCallback(() => {
    setPhase("start");
    setCurrentQ(0);
    setAnswers(new Array(TOTAL).fill(-1));
  }, []);

  /* ---- Render ---- */

  if (phase === "start") return <StartScreen onStart={startQuiz} />;

  if (phase === "quiz") {
    const q = QUIZ_QUESTIONS[currentQ];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-md md:max-w-lg">
          <ProgressBar current={currentQ + 1} total={TOTAL} />
          <div className="mt-6">
            <QuestionCard
              key={animKey}
              question={q}
              index={currentQ}
              selectedOption={answers[currentQ]}
              direction={slideDir}
              onSelect={selectOption}
            />
          </div>
          {currentQ > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="mt-5 mx-auto block text-sm md:text-base text-[#8b7355]/40 hover:text-[#8b7355] transition-colors"
            >
              ← 上一题
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!scores || !svtiType) return null;
  return (
    <ResultScreen
      scores={scores}
      svtiType={svtiType}
      onRestart={restart}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Start Screen                                                       */
/* ------------------------------------------------------------------ */

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="max-w-md md:max-w-lg w-full text-center">
        {/* Hero icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-[#f5c842]/20 to-[#c4a35a]/10 border-2 border-[#f5c842]/30 flex items-center justify-center shadow-lg">
            <Image
              src="/icons/Golden_Walnut.png"
              alt="SVTI"
              width={72}
              height={72}
              className="drop-shadow-md md:w-[88px] md:h-[88px]"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-[#4a3728] mb-2">
          SVTI 测评
        </h1>
        <p className="text-base md:text-lg text-[#8b7355] mb-1">
          Star Valley Type Indicator
        </p>
        <p className="text-xl md:text-2xl text-[#4a3728] font-bold mt-5 mb-3">
          最适合你游玩风格的搭子
        </p>

        {/* Description */}
        <div className="bg-white/60 border border-[#c4a35a]/15 rounded-xl p-5 mt-4 mb-7 text-base md:text-lg text-[#8b7355]/80 leading-relaxed">
          30 道基于《星露谷物语》的情景选择题，<br />
          测出属于你的 25 种星露谷人格类型。<br />
          <span className="text-[#8b7355]/50">大约 3 分钟</span>
        </div>

        {/* Axis tags */}
        <div className="flex justify-center gap-2.5 mb-7 flex-wrap">
          {AXES_META.map((a) => (
            <span
              key={a.key}
              className="px-3.5 py-1.5 rounded-full bg-[#f5c842]/10 border border-[#f5c842]/20 text-xs md:text-sm text-[#4a3728] font-bold"
            >
              {a.label}
            </span>
          ))}
        </div>

        {/* Start button */}
        <button
          type="button"
          onClick={onStart}
          className="px-10 py-3.5 rounded-xl bg-[#4a7c59] text-white font-bold text-lg md:text-xl hover:bg-[#4a7c59]/90 active:scale-[0.98] transition-all shadow-md"
        >
          开始测评
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress Bar                                                       */
/* ------------------------------------------------------------------ */

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 rounded-full bg-[#e8dcc8] border border-[#c4a35a]/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#4a7c59] to-[#6ba368] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs md:text-sm text-[#8b7355]/60 font-bold tabular-nums w-12 text-right">
        {current}/{total}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Question Card                                                      */
/* ------------------------------------------------------------------ */

function QuestionCard({
  question,
  index,
  selectedOption,
  direction,
  onSelect,
}: {
  question: (typeof QUIZ_QUESTIONS)[number];
  index: number;
  selectedOption: number;
  direction: 1 | -1;
  onSelect: (optIdx: number) => void;
}) {
  const [entered, setEntered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => setEntered(true), 20);
    return () => clearTimeout(timerRef.current);
  }, []);

  const slideIn = entered
    ? "translate-x-0 opacity-100"
    : direction > 0
      ? "translate-x-12 opacity-0"
      : "-translate-x-12 opacity-0";

  return (
    <div className={`transition-all duration-300 ease-out ${slideIn}`}>
      {/* Question */}
      <div className="bg-white/70 border border-[#c4a35a]/15 rounded-xl p-5 md:p-7 mb-5 text-center">
        <p className="text-xs md:text-sm text-[#8b7355]/40 font-bold mb-2">
          {index + 1}
        </p>
        <p className="text-xl md:text-2xl text-[#4a3728] font-bold leading-relaxed">
          {question.scenario}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 md:space-y-4">
        {question.options.map((opt, optIdx) => {
          const isSelected = selectedOption === optIdx;
          return (
            <button
              key={optIdx}
              type="button"
              onClick={() => onSelect(optIdx)}
              className={`w-full text-left px-5 py-4 md:py-5 rounded-xl border-2 transition-all duration-200
                ${isSelected
                  ? "border-[#4a7c59] bg-[#4a7c59]/10 shadow-sm"
                  : "border-[#c4a35a]/15 bg-white/50 hover:border-[#c4a35a]/40 hover:bg-white/70 active:scale-[0.99]"
                }`}
            >
              <span className="flex items-center gap-3">
                <Image
                  src={opt.icon}
                  alt=""
                  width={28}
                  height={28}
                  className="shrink-0"
                />
                <span
                  className={`text-lg md:text-xl leading-relaxed ${isSelected ? "text-[#4a7c59] font-bold" : "text-[#4a3728]"}`}
                >
                  {opt.text}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Result Screen                                                      */
/* ------------------------------------------------------------------ */

function ResultScreen({
  scores,
  svtiType,
  onRestart,
}: {
  scores: ReturnType<typeof calculateQuizScores>;
  svtiType: NonNullable<ReturnType<typeof calcSVTI>>;
  onRestart: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-5 py-8 transition-all duration-700 ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="w-full max-w-md md:max-w-lg">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-sm md:text-base text-[#8b7355]/50 font-bold tracking-wider mb-1">
          你的 SVTI 类型是
        </p>
      </div>

      {/* SVTI Card */}
      <div className="bg-gradient-to-br from-[#f5c842]/10 to-[#c4a35a]/5 border-2 border-[#f5c842]/30 rounded-xl p-6 md:p-8 text-center mb-6">
        <div className="flex flex-col items-center gap-3 mb-4">
          <Image
            src={`/assets/svti/SVTI-${svtiType.id}.webp`}
            alt={svtiType.name}
            width={180}
            height={180}
            className="drop-shadow-lg"
          />
          <div>
            <p className="text-2xl md:text-3xl font-bold text-[#4a3728]">
              <Image
                src={svtiType.icon}
                alt=""
                width={26}
                height={26}
                className="inline-block align-middle mr-2"
              />
              {svtiType.name}
            </p>
            <p className="text-sm md:text-base text-[#c4a35a] font-bold tracking-wide mt-1.5">
              [{svtiType.id}] {svtiType.tags}
            </p>
          </div>
        </div>
        <p className="text-base md:text-lg text-[#8b7355]/80 leading-relaxed">
          {svtiType.portrait}
        </p>
      </div>

      {/* Axis Bars */}
      <div className="bg-white/60 border border-[#c4a35a]/15 rounded-xl p-5 md:p-6 mb-6">
        <h3 className="text-sm md:text-base font-bold text-[#4a3728] mb-5">三维度分析</h3>
        <div className="space-y-5">
          {AXES_META.map((meta) => {
            const val = scores[meta.key];
            return (
              <div key={meta.key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm text-[#8b7355]/60 font-bold">
                    {meta.left}
                  </span>
                  <span className="text-xs md:text-sm text-[#4a3728] font-bold">
                    {meta.label}
                  </span>
                  <span className="text-xs md:text-sm text-[#8b7355]/60 font-bold">
                    {meta.right}
                  </span>
                </div>
                <div className="relative h-3.5 rounded-full bg-[#e8dcc8] border border-[#c4a35a]/15 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#4a7c59] to-[#6ba368] transition-all duration-1000 ease-out"
                    style={{ width: `${val}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded border-2 border-[#f5c842] bg-white shadow-sm transition-all duration-1000 ease-out"
                    style={{ left: `calc(${val}% - 10px)` }}
                  />
                </div>
                <p className="text-xs text-[#8b7355]/40 text-center mt-1.5">
                  {val}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="px-7 py-3 rounded-xl bg-[#4a7c59] text-white font-bold text-base md:text-lg hover:bg-[#4a7c59]/90 transition-all"
        >
          重新测评
        </button>
      </div>
      </div>
    </div>
  );
}

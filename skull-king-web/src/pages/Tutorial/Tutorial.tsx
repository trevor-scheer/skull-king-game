import { useState } from "react";
import { Link } from "react-router-dom";
import "./Tutorial.scss";
const lessons = [
  {
    title: "Follow the lead suit",
    prompt:
      "The lead card is GREEN 8. You hold GREEN 3, YELLOW 14, and Escape. Which numbered card can you play?",
    choices: ["GREEN 3", "YELLOW 14"],
    answer: 0,
    why: "You must follow green when you have it. A special card such as Escape would also be legal.",
  },
  {
    title: "Trump beats ordinary suits",
    prompt: "YELLOW 14 leads. BLACK 2 and YELLOW 10 follow. Which card wins?",
    choices: ["YELLOW 14", "BLACK 2", "YELLOW 10"],
    answer: 1,
    why: "Black is trump. Even a low black card beats an ordinary suit.",
  },
  {
    title: "The special-card surprise",
    prompt: "Pirate, Skull King, and Mermaid are played together. Who wins?",
    choices: ["Pirate", "Skull King", "Mermaid"],
    answer: 2,
    why: "Mermaid captures Skull King even when a Pirate is also present.",
  },
  {
    title: "Bidding is a promise",
    prompt:
      "You bid one trick. You have already won one. What are you aiming for now?",
    choices: ["Win every remaining trick", "Avoid winning another trick"],
    answer: 1,
    why: "You want exactly your bid. Winning too many tricks misses it just like winning too few.",
  },
  {
    title: "Read your score",
    prompt:
      "Under Classic scoring, you bid two and win two, without bonuses. How many points do you earn?",
    choices: ["20", "40", "−20"],
    answer: 1,
    why: "An exact nonzero Classic bid earns 20 points per trick: 2 × 20 = 40. A successful zero bid earns 10 per card dealt instead.",
  },
];
export function Tutorial() {
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const lesson = lessons[step];
  const correct = choice === lesson?.answer;
  return (
    <main className="Tutorial">
      <Link to="/">← Back to rooms</Link>
      <h1>Learn Skull King by playing</h1>
      {lesson ? (
        <>
          <p>
            Lesson {step + 1} of {lessons.length}
          </p>
          <progress
            value={step}
            max={lessons.length}
            aria-label="Tutorial progress"
          />
          <h2>{lesson.title}</h2>
          <p>{lesson.prompt}</p>
          <div className="Tutorial-choices">
            {lesson.choices.map((label, index) => (
              <button
                key={label}
                aria-pressed={choice === index}
                onClick={() => setChoice(index)}
              >
                {label}
              </button>
            ))}
          </div>
          {choice != null && (
            <p role="status">
              {correct ? "Correct. " : "Try again. "}
              {lesson.why}
            </p>
          )}
          <button
            disabled={!correct}
            onClick={() => {
              setStep(step + 1);
              setChoice(null);
            }}
          >
            Next lesson
          </button>
        </>
      ) : (
        <>
          <h2>You’re ready for the table.</h2>
          <p>
            Bid exactly, follow suit, and watch the special cards. Each room’s
            rules panel explains its optional cards and scoring.
          </p>
          <Link to="/">Join or create a room</Link>
          <button
            onClick={() => {
              setStep(0);
              setChoice(null);
            }}
          >
            Practice again
          </button>
        </>
      )}
    </main>
  );
}

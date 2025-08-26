# RAG Evaluations (RAGAS) & Nightly CI

Automate retrieval/answer quality checks using **RAGAS** metrics and run them **nightly** in GitHub Actions. Produces a JSON/CSV report and fails the job on regression.

---

## 1) Overview

* **Dataset**: a small golden set of questions with reference answers and (optionally) reference contexts.
* **Prediction**: call your non‑streaming tutor endpoint (`/api/chat/lesson`) to generate answers.
* **Scoring**: run **RAGAS** metrics: faithfulness, answer\_relevancy, context\_precision, context\_recall.
* **CI**: scheduled workflow writes artifacts and status badge, fails if below thresholds.

---

## 2) Repo layout

```
tools/evals/
  dataset.jsonl           # golden Q/A (+optional contexts)
  ragas_eval.py           # main evaluator
  README.md
```

---

## 3) Prepare golden dataset

Create `tools/evals/dataset.jsonl`:

```jsonl
{"question": "Explain the distributive property.", "answer": "a(b+c)=ab+ac with example.", "contexts": []}
{"question": "What is a rational number?", "answer": "Any number expressible as a/b with integers and b!=0.", "contexts": []}
{"question": "How do you convert a fraction to a decimal?", "answer": "Divide numerator by denominator; may terminate or repeat.", "contexts": []}
```

> Add \~20–50 high‑quality items per subject to start. If you have curated pages, place text snippets into `contexts` to evaluate retrieval more strictly.

---

## 4) Python environment

Create a **Python 3.11** venv locally or use CI only.

```bash
python -m venv .venv
source .venv/bin/activate
pip install ragas datasets pandas openai tiktoken
```

Set env (locally and in CI Secrets):

```bash
export OPENAI_API_KEY=sk-...
export APP_URL=http://localhost:3000 # or your deployed URL
export MODEL_NAME=gpt-4o-mini        # judge & embed model used by ragas
```

---

## 5) Evaluator script

Create `tools/evals/ragas_eval.py`:

```python
import os, json, time
import pandas as pd
import requests
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall

APP_URL = os.environ.get("APP_URL", "http://localhost:3000")
MODEL_NAME = os.environ.get("MODEL_NAME", "gpt-4o-mini")
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

# RAGAS uses OpenAI under the hood for judgments. Configure via env var.
os.environ["RAGAS_OPENAI_API_KEY"] = OPENAI_API_KEY
os.environ["RAGAS_OPENAI_MODEL"] = MODEL_NAME


def predict(question: str) -> dict:
    """Call your non-streaming endpoint and return {answer, citations?}."""
    url = f"{APP_URL}/api/chat/lesson"
    r = requests.post(url, json={"question": question, "k": 6}, timeout=120)
    r.raise_for_status()
    data = r.json()
    return {"answer": data.get("answer", ""), "contexts": []}


def load_dataset(path: str):
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            j = json.loads(line)
            rows.append(j)
    return rows


def main():
    rows = load_dataset("tools/evals/dataset.jsonl")
    preds = []
    for i, row in enumerate(rows):
        ans = predict(row["question"])  # {answer, contexts}
        preds.append({
            "question": row["question"],
            "answer": ans["answer"],
            "contexts": ans.get("contexts", row.get("contexts", [])),
            "ground_truth": row["answer"],
        })
        time.sleep(0.5)  # be nice to your API

    ds = Dataset.from_list(preds)
    result = evaluate(
        ds,
        metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
    )

    df = result.to_pandas()
    os.makedirs("tools/evals/out", exist_ok=True)
    ts = int(time.time())
    csv_path = f"tools/evals/out/ragas_{ts}.csv"
    json_path = f"tools/evals/out/ragas_{ts}.json"
    df.to_csv(csv_path, index=False)
    df.to_json(json_path, orient="records")

    # thresholds
    thresholds = {
        "faithfulness": 0.80,
        "answer_relevancy": 0.75,
        "context_precision": 0.60,
        "context_recall": 0.60,
    }

    # compute means and assert
    means = df.mean(numeric_only=True).to_dict()
    print("Metric means:", means)

    bad = []
    for k, thr in thresholds.items():
        val = means.get(k, 0)
        if val < thr:
            bad.append((k, val, thr))

    with open("tools/evals/out/summary.txt", "w") as f:
        for k, v in means.items():
            f.write(f"{k}: {v:.3f}\n")
        if bad:
            f.write("FAILURES:\n")
            for (k, v, thr) in bad:
                f.write(f" - {k}: {v:.3f} < {thr}\n")

    if bad:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
```

> If you want to evaluate **retrieval** more strictly, return actual snippets in `predict()` (from `/api/rag/hybrid-query`) and pass them under `contexts`.

---

## 6) Nightly GitHub Action

Create `.github/workflows/nightly-ragas.yml`:

```yaml
name: nightly-ragas
on:
  schedule:
    - cron: "0 2 * * *"  # nightly 02:00 UTC
  workflow_dispatch: {}

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install deps
        run: |
          python -m pip install --upgrade pip
          pip install ragas datasets pandas openai tiktoken requests
      - name: Run RAGAS
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          APP_URL: ${{ secrets.APP_URL }}
          MODEL_NAME: gpt-4o-mini
        run: |
          python tools/evals/ragas_eval.py
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ragas-results
          path: tools/evals/out/*
```

> Store `OPENAI_API_KEY` and `APP_URL` as **GitHub Secrets**. The job will fail if metrics fall below thresholds.

---

## 7) Local run

```bash
export APP_URL=http://localhost:3000
export OPENAI_API_KEY=sk-...
python tools/evals/ragas_eval.py
open tools/evals/out/summary.txt
```

---

## 8) Optional improvements

* Add a second job to post results to **Slack** or create a **GitHub Pages** dashboard.
* Track metrics over time (append to a CSV / SQLite) to see trends.
* Add subject‑specific thresholds.
* Evaluate **hybrid vs vector‑only** by adding a second predictor.

With this setup, you get continuous signal on **faithfulness** and **retrieval quality** and catch regressions automatically.

#!/usr/bin/env python3
"""
RAGAS Evaluation Script for AI School
Evaluates RAG system quality using faithfulness, answer_relevancy, context_precision, context_recall
"""

import os
import json
import time
import requests
import pandas as pd
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall

# Configuration
APP_URL = os.environ.get("APP_URL", "http://localhost:3006")
MODEL_NAME = os.environ.get("MODEL_NAME", "gpt-4o-mini")
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

# RAGAS uses OpenAI under the hood for judgments. Configure via env var.
os.environ["RAGAS_OPENAI_API_KEY"] = OPENAI_API_KEY
os.environ["RAGAS_OPENAI_MODEL"] = MODEL_NAME

def predict(question: str) -> dict:
    """Call the non-streaming evaluation endpoint and return {answer, contexts}."""
    url = f"{APP_URL}/api/chat/lesson/eval"
    try:
        r = requests.post(
            url, 
            json={"question": question, "k": 6, "alpha": 0.5}, 
            timeout=120
        )
        r.raise_for_status()
        data = r.json()
        return {
            "answer": data.get("answer", ""), 
            "contexts": data.get("contexts", [])
        }
    except Exception as e:
        print(f"Error calling API for question '{question}': {e}")
        return {"answer": "", "contexts": []}

def load_dataset(path: str):
    """Load the golden dataset from JSONL file."""
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():  # Skip empty lines
                j = json.loads(line)
                rows.append(j)
    return rows

def main():
    """Main evaluation function."""
    print("Starting RAGAS evaluation...")
    print(f"APP_URL: {APP_URL}")
    print(f"MODEL_NAME: {MODEL_NAME}")
    
    # Load golden dataset
    dataset_path = "tools/evals/dataset.jsonl"
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset file not found at {dataset_path}")
        return
    
    rows = load_dataset(dataset_path)
    print(f"Loaded {len(rows)} questions from dataset")
    
    # Generate predictions
    preds = []
    for i, row in enumerate(rows):
        print(f"Processing question {i+1}/{len(rows)}: {row['question'][:50]}...")
        
        ans = predict(row["question"])
        preds.append({
            "question": row["question"],
            "answer": ans["answer"],
            "contexts": ans.get("contexts", row.get("contexts", [])),
            "ground_truth": row["answer"],
        })
        
        # Be nice to the API
        time.sleep(0.5)
    
    # Create dataset for RAGAS
    ds = Dataset.from_list(preds)
    
    # Run evaluation
    print("Running RAGAS evaluation...")
    result = evaluate(
        ds,
        metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
    )
    
    # Convert to pandas and save results
    df = result.to_pandas()
    os.makedirs("tools/evals/out", exist_ok=True)
    ts = int(time.time())
    csv_path = f"tools/evals/out/ragas_{ts}.csv"
    json_path = f"tools/evals/out/ragas_{ts}.json"
    
    df.to_csv(csv_path, index=False)
    df.to_json(json_path, orient="records")
    
    print(f"Results saved to {csv_path} and {json_path}")
    
    # Define thresholds
    thresholds = {
        "faithfulness": 0.80,
        "answer_relevancy": 0.75,
        "context_precision": 0.60,
        "context_recall": 0.60,
    }
    
    # Compute means and check against thresholds
    means = df.mean(numeric_only=True).to_dict()
    print("\nMetric means:")
    for k, v in means.items():
        print(f"  {k}: {v:.3f}")
    
    # Check for failures
    bad = []
    for k, thr in thresholds.items():
        val = means.get(k, 0)
        if val < thr:
            bad.append((k, val, thr))
    
    # Write summary
    summary_path = "tools/evals/out/summary.txt"
    with open(summary_path, "w") as f:
        f.write("RAGAS Evaluation Summary\n")
        f.write("=" * 30 + "\n\n")
        f.write("Metric Results:\n")
        for k, v in means.items():
            f.write(f"  {k}: {v:.3f}\n")
        
        if bad:
            f.write("\nFAILURES:\n")
            for (k, v, thr) in bad:
                f.write(f"  - {k}: {v:.3f} < {thr}\n")
        else:
            f.write("\nAll metrics passed thresholds! ✅\n")
    
    print(f"\nSummary written to {summary_path}")
    
    # Exit with error if any metrics failed
    if bad:
        print("\n❌ Some metrics failed thresholds:")
        for (k, v, thr) in bad:
            print(f"  - {k}: {v:.3f} < {thr}")
        raise SystemExit(1)
    else:
        print("\n✅ All metrics passed thresholds!")

if __name__ == "__main__":
    main()

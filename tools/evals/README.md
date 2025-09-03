# RAGAS Evaluation Tools

This directory contains tools for evaluating the AI School RAG system quality using RAGAS metrics.

## Files

- `dataset.jsonl` - Golden dataset with Q/A pairs for evaluation
- `ragas_eval.py` - Main evaluation script
- `out/` - Directory for evaluation results (created automatically)

## Setup

1. Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export OPENAI_API_KEY=sk-...
export APP_URL=http://localhost:3006  # or your deployed URL
export MODEL_NAME=gpt-4o-mini
```

## Running Evaluation

### Local Run
```bash
python tools/evals/ragas_eval.py
```

### GitHub Actions
The evaluation runs automatically every night at 2:00 UTC via GitHub Actions.

## Metrics

The evaluation measures:

- **Faithfulness** (target: 0.80) - How well the answer is grounded in the provided context
- **Answer Relevancy** (target: 0.75) - How relevant the answer is to the question
- **Context Precision** (target: 0.60) - How precise the retrieved context is
- **Context Recall** (target: 0.60) - How well the context covers the answer

## Results

Results are saved to `tools/evals/out/`:
- `ragas_<timestamp>.csv` - Detailed results
- `ragas_<timestamp>.json` - JSON format results
- `summary.txt` - Human-readable summary

## Adding Questions

To add new evaluation questions, edit `dataset.jsonl`:

```json
{"question": "Your question here?", "answer": "Expected answer here.", "contexts": []}
```

## Troubleshooting

- Ensure the web app is running and accessible
- Check that you have sufficient OpenAI API credits
- Verify environment variables are set correctly
- Check the API endpoint `/api/chat/lesson/eval` is working

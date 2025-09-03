#!/usr/bin/env python3
"""
Simple test script to verify the evaluation endpoint works
"""

import requests
import json
import os

def test_evaluation_endpoint():
    """Test the evaluation endpoint with a simple question."""
    
    # Configuration
    app_url = os.environ.get("APP_URL", "http://localhost:3006")
    
    # Test question
    test_data = {
        "question": "What is the Pythagorean theorem?",
        "k": 3,
        "alpha": 0.5
    }
    
    print(f"Testing endpoint: {app_url}/api/chat/lesson/eval")
    print(f"Test data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(
            f"{app_url}/api/chat/lesson/eval",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ Success!")
            print(f"Answer: {data.get('answer', 'No answer')[:200]}...")
            print(f"Contexts: {len(data.get('contexts', []))} retrieved")
            print(f"Strategy: {data.get('strategy', 'unknown')}")
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection error: Make sure the web app is running on localhost:3006")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    test_evaluation_endpoint()

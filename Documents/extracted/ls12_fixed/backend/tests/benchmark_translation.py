import os
import time

# Set local backend
os.environ["TRANSLATION_BACKEND"] = "local"

from app.services.translator import TranslatorService
import asyncio

async def run_benchmark():
    translator = TranslatorService()
    test_text = "पुलिस ने बिना वारंट गिरफ्तार किया"
    
    # Warmup
    print("Warming up local model...")
    await translator.translate_to_english(test_text, "hi")
    
    print("Starting Benchmark...")
    latencies = []
    
    for i in range(5):
        t_start = time.time()
        result = await translator.translate_to_english(test_text, "hi")
        latency = time.time() - t_start
        latencies.append(latency)
        safe_result = result.encode('ascii', 'ignore').decode('ascii')
        print(f"Run {i+1}: {latency:.4f}s -> {safe_result[:50]}...")
        
    avg_latency = sum(latencies) / len(latencies)
    print(f"\n--- BENCHMARK RESULTS ---")
    print(f"Model: ai4bharat/indictrans2-indic-en-dist-200M (int8)")
    print(f"Average Latency (5 runs): {avg_latency:.4f}s")
    
    if avg_latency > 15.0:
        print("Warning: Latency exceeds 15 seconds. CPU bottleneck detected.")
    else:
        print("Latency is within acceptable bounds for MVP.")

if __name__ == "__main__":
    asyncio.run(run_benchmark())

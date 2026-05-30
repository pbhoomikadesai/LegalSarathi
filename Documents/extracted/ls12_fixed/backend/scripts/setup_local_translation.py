import os
import subprocess
import time

def setup_local_translation():
    model_id = "ai4bharat/indictrans2-indic-en-dist-200M"
    output_dir = "data/models/indictrans2-200m-int8"
    
    print(f"Starting acquisition for: {model_id}")
    print("Preparing for CTranslate2 int8 format...")
    
    from huggingface_hub import snapshot_download
    
    print("Downloading weights via huggingface_hub...")
    start_time = time.time()
    
    try:
        snapshot_download(
            repo_id=model_id,
            local_dir=output_dir,
            local_dir_use_symlinks=False
        )
    except Exception as e:
        print("Error during download:", e)
        return
        
    end_time = time.time()
    
    # Check size
    total_size = 0
    for dirpath, _, filenames in os.walk(output_dir):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if not os.path.islink(fp):
                total_size += os.path.getsize(fp)
                
    print(f"Download and Conversion Complete in {end_time - start_time:.2f} seconds.")
    print(f"Disk Usage (int8): {total_size / (1024*1024):.2f} MB")

if __name__ == "__main__":
    setup_local_translation()

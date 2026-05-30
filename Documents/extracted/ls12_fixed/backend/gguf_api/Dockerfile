FROM python:3.11-slim

# Install system dependencies for compiling llama-cpp-python
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install llama-cpp-python with server extras
# If deploying to a GPU cloud (e.g. RunPod), you would set CMAKE_ARGS="-DLLAMA_CUBLAS=on" before pip install
RUN pip install "llama-cpp-python[server]" uvicorn

# We assume the model is copied into the container during build.
# Copy your legal-llama-1b.gguf into the gguf_api folder before running `docker build`.
COPY legal-llama-1b.gguf /app/model.gguf

EXPOSE 8000

# Start the OpenAI-compatible FastAPI server
CMD ["python", "-m", "llama_cpp.server", "--model", "/app/model.gguf", "--host", "0.0.0.0", "--port", "8000", "--n_ctx", "2048"]

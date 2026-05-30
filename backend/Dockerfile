# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=7860 \
    HOME=/home/user \
    PLAYWRIGHT_BROWSERS_PATH=/home/user/.cache/ms-playwright

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    g++ \
    git \
    poppler-utils \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user (Hugging Face Spaces runs as user 1000)
RUN useradd -m -u 1000 user
WORKDIR $HOME/app

# Copy requirements file first for caching
COPY --chown=user:user requirements.txt .

# Upgrade pip, install lightweight CPU-only PyTorch, install playwright package explicitly, and install requirements
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch==2.5.1 --extra-index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir playwright==1.60.0 && \
    pip install --no-cache-dir -r requirements.txt

# Create cache directory and install Playwright browser binaries in the user's home path
RUN mkdir -p /home/user/.cache/ms-playwright && \
    playwright install chromium && \
    chmod -R 777 /home/user/.cache

# Copy the rest of the application
COPY --chown=user:user . .

# Set permissions for the entire home directory
RUN chmod -R 777 $HOME

# Switch to the non-root user
USER user

# Expose port 7860 (Hugging Face standard port)
EXPOSE 7860

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]

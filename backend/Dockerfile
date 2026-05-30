# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=7860 \
    HOME=/home/user

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

# Upgrade pip and install lightweight CPU-only PyTorch first to save space, then the rest
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch==2.5.1 --extra-index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Install Playwright browser binary
RUN playwright install chromium

# Copy the rest of the application
COPY --chown=user:user . .

# Set permissions
RUN chmod -R 777 $HOME

# Switch to the non-root user
USER user

# Expose port 7860 (Hugging Face standard port)
EXPOSE 7860

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]

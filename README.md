# CrisisSync

A real-time crisis response and coordination dashboard for hospitality venues, built as a unified single-file React application.

## Features
- **Live Map**: Real-time visual tracking of incidents and staff members on different floors.
- **Incident Management**: Incident board, details side-panel, and full timeline tracking.
- **AI Triage**: Automatic classification and prioritization using the Google Gemini 2.5 API.
- **Auto Dispatch**: AI-driven smart dispatch logic pairing available staff based on proximity and role.
- **Communications**: Guest and staff communication channels with live translations and AI-assisted drafting.
- **Analytics**: Dashboard capturing KPIs and generating AI-based executive summaries.

## How to Run Locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start the local development server**
   ```bash
   npm run dev
   ```

4. **View the Application**
   Open your browser to `http://localhost:5173`.


## How to Host on Google Cloud (Cloud Run)

To host this publicly, we use **Google Cloud Run**, a serverless environment perfect for containerized apps.

### Prerequisites
1. A Google Cloud Platform (GCP) account.
2. [Google Cloud CLI (gcloud)](https://cloud.google.com/sdk/docs/install) installed and authenticated (`gcloud auth login`).

### Deployment Steps
A `Dockerfile` has been included in this repository.

1. **Set your Google Cloud Project**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Deploy using Cloud Run**
   Run the following command from the project root:
   ```bash
   gcloud run deploy crisis-sync --source . --region us-central1 --allow-unauthenticated
   ```
   *This command will securely build the Dockerfile using Cloud Build behind the scenes and deploy the resulting standard Nginx web container.*

3. **Access your App**
   Once deployment completes, the CLI will output a "Service URL" (e.g., `https://crisis-sync-xxx.a.run.app`). Open this URL in your web browser.

### Infrastructure Details
- **Frontend Build**: Handled automatically via Vite.
- **Container**: `nginx:stable-alpine` serves the static built files efficiently.
- **Data Storage**: In-memory (mock data pre-populated on load).
- **AI Features**: Google Gemini 2.5 Flash API (accessed directly via the client).

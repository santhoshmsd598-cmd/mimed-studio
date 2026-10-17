# mimed-studio
# MIME'D Studio

A full-stack creator collaboration platform that connects brands and creators through campaigns, content submissions, and review workflows.

## Live Demo

- **Frontend:** [Open MIME'D Studio](https://mimed-studio.vercel.app)
- **Backend API:** https://mimed-studio.onrender.com
- **GitHub Repository:** https://github.com/santhoshmsd598-cmd/mimed-studio

*If your Vercel production URL differs from the URL above, replace it with the actual URL shown in your Vercel dashboard.*

## Features

- Brand and creator registration and login
- Role-based access control
- Campaign creation and campaign browsing
- Creator campaign participation
- Content submissions and brand reviews
- Campaign and submission management
- REST API integration
- MongoDB Atlas database
- Responsive web interface

## Tech Stack

**Frontend**
- Next.js
- React
- TypeScript
- CSS

**Backend**
- Node.js
- Express.js
- TypeScript
- MongoDB Atlas
- Mongoose
- JWT authentication

**Deployment**
- Vercel — frontend
- Render — backend
- MongoDB Atlas — database

## Project Structure

```text
mimed-studio/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   ├── public/
│   ├── package.json
│   └── next.config.ts
├── .gitignore
└── README.md
```

## Local Setup

### Prerequisites

- Node.js and npm
- A MongoDB Atlas database or local MongoDB instance

### 1. Clone the repository

```bash
git clone https://github.com/santhoshmsd598-cmd/mimed-studio.git
cd mimed-studio
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file using the variables documented in `backend/.env.example`. Fill in your own database URI, JWT secret, frontend URL, and any email settings required by your implementation.

Run the backend:

```bash
npm run dev
```

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Run the frontend:

```bash
npm run dev
```

Open http://localhost:3000.

## Production Environment

Configure environment variables in the deployment dashboards rather than committing secret values to Git.

The frontend uses `NEXT_PUBLIC_API_URL` to locate the backend API. In production, set it to the deployed backend URL.

The backend requires a valid MongoDB connection string and the other environment variables required by its configuration.

## Security

- Do not commit `.env` or `.env.local` files.
- Use strong, unique secrets in production.
- Keep database credentials and email passwords private.
- Configure the backend CORS origin to allow the deployed frontend.

## License

No license has been specified yet.

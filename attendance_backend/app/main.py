from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth_routes import router as auth_router
from app.api.session_routes import router as session_router
from app.api.attendance_routes import router as attendance_router
from app.api.course_routes import router as course_router
from app.api.admin_routes import router as admin_router
from app.api.student_routes import router as student_router

app = FastAPI(
    title="Smart Attendance API",
    description="QR-code-based attendance tracking system for universities.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — adjust origins for production deployment
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router)
app.include_router(session_router)
app.include_router(attendance_router)
app.include_router(course_router)
app.include_router(admin_router)
app.include_router(student_router)


@app.get("/", tags=["Health"])
def health_check() -> dict:
    return {"status": "ok", "message": "Smart Attendance API using QR Codes running"}

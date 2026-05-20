from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.db.models import User
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.services.auth_service import get_password_hash, verify_password, create_access_token
from datetime import datetime, timezone
from fastapi import Request
from user_agents import parse
from app.db.models.user_session import UserSession

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_data.email.lower()).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email.lower(),
        password_hash=hashed_password,
        full_name=user_data.full_name,
        openedx_user_id=user_data.openedx_user_id,
        lms_username=user_data.lms_username
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user.last_login = datetime.now(timezone.utc)
    
    # Session tracking
    user_agent_str = request.headers.get("user-agent", "")
    ip_address = request.client.host if request.client else None
    
    parsed_ua = parse(user_agent_str)
    device_type = "mobile" if parsed_ua.is_mobile else "tablet" if parsed_ua.is_tablet else "desktop"
    device_info = f"{parsed_ua.browser.family} on {parsed_ua.os.family}" if parsed_ua.browser.family else "Unknown Device"
    
    new_session = UserSession(
        user_id=user.id,
        device_info=device_info,
        device_type=device_type,
        ip_address=ip_address,
        last_active=datetime.now(timezone.utc)
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    access_token = create_access_token(data={"sub": str(user.id), "session_id": str(new_session.id)})
    return {"access_token": access_token, "token_type": "bearer"}

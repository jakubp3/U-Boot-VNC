from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    
    @field_validator('email', mode='before')
    @classmethod
    def validate_email(cls, v):
        # Allow .local domains and other special domains
        if isinstance(v, str):
            # Replace .local with .example.com for validation
            if v.endswith('.local'):
                v = v.replace('.local', '.example.com')
        return v


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_admin: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class VNCMachineBase(BaseModel):
    name: str
    url: str
    description: Optional[str] = None


class VNCMachineCreate(VNCMachineBase):
    is_shared: bool = False


class VNCMachineUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    is_shared: Optional[bool] = None


class VNCMachineResponse(VNCMachineBase):
    id: int
    owner_id: int
    is_shared: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


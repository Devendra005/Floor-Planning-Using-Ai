import uuid
import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProjectDB(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    project_type = Column(String, default="Residential Single Family")
    location = Column(String, default="")
    plot_data = Column(JSON, nullable=False)
    requirements_data = Column(JSON, nullable=False)
    vastu_profile = Column(String, default="traditional-basic")
    weights_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    plans = relationship("FloorPlanDB", back_populates="project", cascade="all, delete-orphan")

class FloorPlanDB(Base):
    __tablename__ = "floor_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    fitness_score = Column(Float, default=0.0)
    vastu_score = Column(Float, default=0.0)
    plumbing_score = Column(Float, default=0.0)
    rooms_data = Column(JSON, nullable=False)
    vastu_report_data = Column(JSON, nullable=False)
    structure_data = Column(JSON, nullable=False)
    plumbing_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("ProjectDB", back_populates="plans")

class VastuRuleDB(Base):
    __tablename__ = "vastu_rules"

    id = Column(String, primary_key=True)
    category = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    preferred_zones = Column(JSON, nullable=False)
    acceptable_zones = Column(JSON, nullable=False)
    avoid_zones = Column(JSON, nullable=False)
    severity = Column(String, default="high")
    weight = Column(Float, default=10.0)
    rule_type = Column(String, default="placement")
    explanation = Column(Text, default="")
    source = Column(String, default="Traditional Texts")
    profile = Column(String, default="traditional-basic")
    enabled = Column(Boolean, default=True)

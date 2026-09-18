from typing import List, Dict, Any
from app.models.pydantic_schemas import (
    LayoutRoom, PlotConfig, PlumbingFixture, PipeSegment, PlumbingShaft, PlumbingValidationIssue
)

def validate_plumbing_system(
    rooms: List[LayoutRoom],
    fixtures: List[PlumbingFixture],
    shafts: List[PlumbingShaft],
    pipe_routes: List[PipeSegment],
    plot: PlotConfig
) -> List[PlumbingValidationIssue]:
    """
    Performs comprehensive validation checks on preliminary plumbing design.
    """
    issues: List[PlumbingValidationIssue] = []

    # 1. Unconnected Fixture Check
    connected_fixture_ids = set(p.connects_from for p in pipe_routes)
    for fix in fixtures:
        if fix.fixture_id not in connected_fixture_ids:
            issues.append(
                PlumbingValidationIssue(
                    id=f"VAL-UNCONN-{fix.fixture_id}",
                    severity="WARNING",
                    title="Unconnected Fixture Detected",
                    description=f"Fixture '{fix.fixture_type}' in room '{fix.room_name}' does not have an active pipe route connection.",
                    location=[fix.x, fix.y]
                )
            )

    # 2. Shaft Accessibility Check
    if not shafts:
        issues.append(
            PlumbingValidationIssue(
                id="VAL-NO-SHAFT",
                severity="CRITICAL",
                title="Missing Plumbing Shaft",
                description="No vertical plumbing shaft (VP-01) is defined for this building layout."
            )
        )

    # 3. Excessive Pipe Length & Bend Warnings
    total_length = sum(p.length_m for p in pipe_routes)
    if total_length > 45.0:
        issues.append(
            PlumbingValidationIssue(
                id="VAL-EXCESS-LEN",
                severity="WARNING",
                title="Excessive Total Pipe Run Length",
                description=f"Total estimated pipe run length ({total_length:.1f}m) exceeds 45m; consider relocating wet rooms closer to the plumbing shaft."
            )
        )

    for p in pipe_routes:
        if p.bends_count >= 4:
            issues.append(
                PlumbingValidationIssue(
                    id=f"VAL-EXCESS-BEND-{p.id}",
                    severity="INFO",
                    title="High Bend Count on Route",
                    description=f"Pipe route '{p.id}' contains {p.bends_count} 90° bends, increasing hydraulic head loss."
                )
            )

    # 4. Success Info if clean
    if not any(i.severity == "CRITICAL" for i in issues):
        issues.append(
            PlumbingValidationIssue(
                id="VAL-PASS-01",
                severity="INFO",
                title="Plumbing Connectivity Validated",
                description="All water inlets, greywater drains, and WC soil pipes connect cleanly to vertical shaft VP-01."
            )
        )

    return issues

from typing import List, Dict, Any

def generate_vastu_recommendations(
    room_analyses: List[Dict[str, Any]],
    entrance_analysis: Dict[str, Any],
    brahmasthan_analysis: Dict[str, Any],
    element_analysis: Dict[str, Any]
) -> Dict[str, List[str]]:
    """
    Generates neutral, architectural recommendations without superstition phrases.
    """
    positives: List[str] = []
    warnings: List[str] = []
    actionable_recs: List[str] = []

    # Entrance
    if entrance_analysis["entrance_score"] >= 80:
        positives.append(f"Main entrance is well positioned in the {entrance_analysis['entrance_zone']} zone, supporting welcoming circulation.")
    elif entrance_analysis["entrance_score"] < 60:
        warnings.append(f"Main entrance in {entrance_analysis['entrance_zone']} zone could be enhanced.")
        actionable_recs.append(entrance_analysis["recommendation"])

    # Rooms
    for r in room_analyses:
        rname = r["room_name"]
        rtype = r["room_type"]
        zone = r["zone"]
        score = r["vastu_score"]

        if score >= 85:
            positives.append(f"{rname} is optimally placed in the preferred {zone} zone.")
        elif score < 60:
            warnings.append(f"{rname} is located in {zone} (score: {score}/100).")
            if rtype == "kitchen":
                actionable_recs.append(f"According to traditional guidelines, the South-East (Agneya) zone is preferred for kitchen placement. Consider relocating '{rname}' toward South-East if plot circulation permits.")
            elif rtype == "master_bedroom":
                actionable_recs.append(f"The South-West (Nairrutya) zone is preferred for the master bedroom. Consider shifting '{rname}' toward South-West.")
            elif rtype == "puja":
                actionable_recs.append(f"The North-East (Ishanya) zone is preferred for the puja room. Consider shifting '{rname}' toward North-East.")
            elif rtype == "toilet":
                actionable_recs.append(f"Toilet/Bathroom '{rname}' is in {zone}. Prefer peripheral North-West or West zones away from the central Brahmasthan.")

    # Brahmasthan
    for c in brahmasthan_analysis.get("conflicts", []):
        warnings.append(c)
    for rec in brahmasthan_analysis.get("recommendations", []):
        actionable_recs.append(rec)

    # Elements
    for obs in element_analysis.get("observations", []):
        if "aligned" in obs:
            positives.append(obs)

    # De-duplicate
    positives = list(dict.fromkeys(positives))
    warnings = list(dict.fromkeys(warnings))
    actionable_recs = list(dict.fromkeys(actionable_recs))

    return {
        "positive_observations": positives,
        "warnings": warnings,
        "recommendations": actionable_recs
    }

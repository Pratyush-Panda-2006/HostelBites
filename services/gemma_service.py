"""Gemma 2 WhatsApp Promo Generator via Groq SDK for HostelBites."""

import os
import json
import logging
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("hostelbites.gemma")

SYSTEM_PROMPT = """You are an expert viral copywriter for Indian late-night engineering campus roll and burger stalls (like those outside ITER, KIIT, or Manipal).
Your audience: Hungry hostellers studying late or gaming past midnight.
Output strict JSON with:

combos: List of 2 irresistible combo meal names using the surplus stock (e.g., 'End-Sem All-Nighter Roll Combo: 1 Double Chicken Roll + Thums Up @ ₹99').

whatsapp_broadcast: A punchy WhatsApp text broadcast packed with emojis, bolding, deadline urgency ('Offer valid till 1:30 AM only'), and local campus slang.

line_cook_instruction: A 2-line practical instruction in Hinglish telling the kitchen staff which items to batch-fry first."""


def _get_fallback_deals(stall_name: str, leftovers: dict, risk_level: str, exam_context: str) -> dict:
    """Provides authentic late-night campus fallback deals when Groq is unavailable."""
    chicken = leftovers.get("chicken_kg", leftovers.get("leftover_chicken_kg", 0.0))
    paneer = leftovers.get("paneer_kg", leftovers.get("leftover_paneer_kg", 0.0))
    bread = leftovers.get("bread_units", leftovers.get("leftover_bread_units", 0))

    if chicken > 0:
        combo1 = f"🔥 {stall_name} Midnight Striker: 1x Jumbo Butter Chicken Roll + Masala Fries @ ₹129 (Flat 35% OFF)"
    else:
        combo1 = f"🔥 {stall_name} Midnight Striker: 1x Double Egg Roll + Hot Tea @ ₹79 (Flat 30% OFF)"

    if paneer > 0:
        combo2 = f"🧀 Backbencher Special: 1x Crispy Paneer Tikka Burger + Cold Beverage @ ₹99 (Save ₹50)"
    else:
        combo2 = f"🍞 Hostel Survivor Combo: 2x Toasted Bun Omelette + Masala Chai @ ₹69"

    discount_str = "40% OFF" if risk_level == "High" else "25% OFF"
    deadline_str = "1:45 AM" if risk_level == "High" else "2:30 AM"

    whatsapp = (
        f"🚨 *MIDNIGHT CRAVINGS EMERGENCY ALERT* 🚨\n\n"
        f"Hostelites of {exam_context}! 📚🎮 Burn the midnight oil, not your wallet!\n\n"
        f"*{stall_name}* is clearing today's kitchen surplus with *FLAT {discount_str}* for the next 45 mins!\n\n"
        f"🌯 *COMBO 1:* {combo1}\n"
        f"🍔 *COMBO 2:* {combo2}\n\n"
        f"⏰ *HURRY:* Offer strictly valid till *{deadline_str}* or till stock lasts!\n"
        f"🛵 *Free delivery* to Hostel Gates 1 to 5. Ping back or call immediately to lock your order! 🚀"
    )

    cook_inst = (
        f"Bhaiya, sabse pehle {chicken:.1f}kg chicken and {paneer:.1f}kg paneer ko high flame par batch-fry kardo. "
        f"{bread} breads aur parathas ready rakho, agle 30 minute mein saara flash-sale clear karna hai!"
    )

    return {
        "combos": [combo1, combo2],
        "whatsapp_broadcast": whatsapp,
        "line_cook_instruction": cook_inst,
    }


def generate_midnight_deals(
    stall_name: str, leftovers: dict, risk_level: str, exam_context: str
) -> Dict[str, Any]:
    """Generates viral late-night combos and WhatsApp copy using Groq (gemma2-9b-it).

    Args:
        stall_name: Name of the food stall or kitchen.
        leftovers: Dictionary with chicken_kg, paneer_kg, bread_units.
        risk_level: 'High', 'Moderate', or 'Safe'.
        exam_context: Information like 'Mid-Sem Exam Week' or campus name.

    Returns:
        dict containing 'combos', 'whatsapp_broadcast', 'line_cook_instruction'.
    """
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key or api_key.strip() in ("", "your_groq_api_key_here"):
        logger.warning("GROQ_API_KEY not configured. Utilizing campus fallback copy generator.")
        return _get_fallback_deals(stall_name, leftovers, risk_level, exam_context)

    try:
        from groq import Groq

        client = Groq(api_key=api_key)

        user_prompt = f"""
STALL NAME: {stall_name}
SURPLUS LEFTOVER STOCK:
- Chicken: {leftovers.get('chicken_kg', leftovers.get('leftover_chicken_kg', 0))} kg
- Paneer: {leftovers.get('paneer_kg', leftovers.get('leftover_paneer_kg', 0))} kg
- Bread/Buns: {leftovers.get('bread_units', leftovers.get('leftover_bread_units', 0))} units
SPOILAGE RISK LEVEL: {risk_level}
CAMPUS CONTEXT: {exam_context}

Create high-conversion midnight clearance combos and promotional copy for this stall.
Return pure JSON with keys: 'combos', 'whatsapp_broadcast', 'line_cook_instruction'.
"""

        response = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        data = json.loads(content)

        # Validate structure
        if "combos" in data and "whatsapp_broadcast" in data and "line_cook_instruction" in data:
            return data
        else:
            logger.warning("Groq response JSON missed required keys. Merging with fallback.")
            fallback = _get_fallback_deals(stall_name, leftovers, risk_level, exam_context)
            fallback.update(data)
            return fallback

    except Exception as exc:
        logger.error("Error invoking Groq gemma2-9b-it: %s", exc)
        return _get_fallback_deals(stall_name, leftovers, risk_level, exam_context)

"""ElevenLabs Voice Service for HostelBites Kitchen Staff Briefings."""

import os
import logging
from typing import Iterator
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("hostelbites.voice")

# Common voice ID for 'George' (warm, narrative male voice in ElevenLabs library)
GEORGE_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"


def generate_cook_audio(hinglish_script: str) -> bytes:
    """Generates audio briefing for line cooks using ElevenLabs TTS.

    Args:
        hinglish_script: 2-line practical instructions in Hinglish.

    Returns:
        bytes: Raw MP3 audio bytes, or empty bytes if API key is missing or failed.
    """
    api_key = os.getenv("ELEVENLABS_API_KEY")

    if not api_key or api_key.strip() in ("", "your_elevenlabs_api_key_here"):
        logger.info("ELEVENLABS_API_KEY missing or unconfigured. Returning empty audio bytes.")
        return b""

    try:
        from elevenlabs.client import ElevenLabs

        client = ElevenLabs(api_key=api_key.strip())

        # Support both modern client.text_to_speech.convert and legacy eleven.generate
        if hasattr(client, "generate"):
            audio = client.generate(
                text=hinglish_script,
                voice="George",
                model="eleven_turbo_v2_5",
            )
            if isinstance(audio, (bytes, bytearray)):
                return bytes(audio)
            elif isinstance(audio, Iterator):
                return b"".join(audio)
            return b""
        elif hasattr(client, "text_to_speech"):
            # Default to George's voice ID or voice name
            audio_stream = client.text_to_speech.convert(
                voice_id=GEORGE_VOICE_ID,
                text=hinglish_script,
                model_id="eleven_turbo_v2_5",
            )
            return b"".join(chunk for chunk in audio_stream)
        else:
            logger.warning("No recognized TTS method on ElevenLabs client.")
            return b""

    except Exception as exc:
        logger.error("ElevenLabs audio generation failed: %s", exc)
        return b""

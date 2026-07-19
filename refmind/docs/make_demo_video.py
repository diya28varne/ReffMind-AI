"""
RefMind 2–3 min demo video builder.
- US female casual voiceover (edge-tts)
- Live browser walkthrough of production demo (Playwright video)
- Mux to downloadable MP4 for YouTube / LinkedIn
"""
from __future__ import annotations

import asyncio
import json
import subprocess
import sys
import wave
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent / "demo-video"
DEMO_URL = "https://hands-on-labs.vercel.app/?demo=wc1986-hand-of-god"
VOICE = "en-US-JennyNeural"  # US woman

# Casual US slang / conversational — OFFSIDE-style “show it live” energy
NARRATION = """
Alright — quick one. This is RefMind.

Y'know those referee calls that break the internet? Everyone's yelling, nobody agrees, and half the time you're not even sure what law they used.

So RefMind is the fix. You vote first — no spoilers — then it shows you why fans fight, what the rule actually says, and what the camera kinda... didn't catch.

Here's the live demo. Hand of God, nineteen eighty-six. Absolute chaos classic.

Boom — you jump in. Yes or no. Did the ref get it right? Don't overthink it. Just vote.

Okay, now the drop. Fan split reveal. You either rode with the crowd... or you were that one friend who swore they saw something else.

Then — this is the spicy part — Why Arguments Last. Four reasons. Not vibes. Rule. Truth. Sightline. Sides. That's why the comments section never dies.

Slide through the perspectives. Fan view. Rule book. What the ref actually saw. Cameras and blind spots. And yeah — you can hit play on the OG clip right in the page.

Google Translate? Tap Spanish, Hindi, whatever. The explainability stuff flips language. Super useful if your group chat is multilingual, no cap.

And if you just wanna mess around — Penalty Kick Lab. Aim, pick a style, beat the keeper. Beginner-friendly, actually fun.

Oh — and Google Gravity. Hit it. Cards fall. Grab 'em. Fling 'em. Whole pitch goes fizzy. Judges love that energy.

Ask Gemini if you're curious about the public noise. Ask the Ref if you want the IFAB-grounded take. Different tools, different jobs.

Final verdict hits with confidence — Correct, Defensible, or Likely Wrong — plus a Guardian audit so random numbers don't just... appear.

That's RefMind. Vote first. Understand the disagreement. Receipts over rage.

Live demo's at hands-on-labs.vercel.app. Link it on LinkedIn, drop it on YouTube — go make people argue smarter.
""".strip()


def ffmpeg_exe() -> str:
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / float(w.getframerate())


async def make_voiceover(mp3_path: Path, wav_path: Path) -> float:
    import edge_tts

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(NARRATION, VOICE, rate="+6%")
    await communicate.save(str(mp3_path))

    # Convert mp3 → wav for duration + reliable mux
    ff = ffmpeg_exe()
    subprocess.run(
        [ff, "-y", "-i", str(mp3_path), "-ar", "44100", "-ac", "2", str(wav_path)],
        check=True,
        capture_output=True,
    )
    return wav_duration(wav_path)


async def record_walkthrough(video_dir: Path, target_seconds: float) -> Path:
    from playwright.async_api import async_playwright

    video_dir.mkdir(parents=True, exist_ok=True)
    # Clear old videos
    for old in video_dir.glob("*.webm"):
        old.unlink()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=str(video_dir),
            record_video_size={"width": 1280, "height": 720},
            device_scale_factor=1,
        )
        page = await context.new_page()
        await page.goto(DEMO_URL, wait_until="domcontentloaded", timeout=90000)
        await page.wait_for_timeout(2500)

        # Pace actions across the voiceover length
        # Approximate beats as fractions of total audio
        t = target_seconds

        async def pause(frac: float):
            await page.wait_for_timeout(int(max(800, t * frac * 1000)))

        # Hook: stay on vote screen
        await pause(0.08)

        # Vote — resilient clickers
        voted = False
        for sel in (
            'button:has-text("YES")',
            'button:has-text("NO")',
            'button:has-text("Yes")',
            'button:has-text("No")',
        ):
            loc = page.locator(sel)
            if await loc.count():
                try:
                    await loc.first.click(timeout=5000, force=True)
                    voted = True
                    break
                except Exception:
                    continue
        if not voted:
            await page.evaluate(
                """() => {
                  const b = [...document.querySelectorAll('button')]
                    .find(x => /^(yes|no)$/i.test((x.textContent||'').trim()));
                  if (b) b.click();
                }"""
            )
        await pause(0.06)

        # Wait for reveal content
        await page.wait_for_timeout(4000)
        await pause(0.1)

        # Scroll through reveal stack
        for _ in range(8):
            await page.mouse.wheel(0, 520)
            await page.wait_for_timeout(int(max(900, (t * 0.06) * 1000)))

        # Translate ES if present
        es = page.get_by_role("button", name="ES")
        if await es.count():
            await es.first.click()
            await page.wait_for_timeout(3500)

        await page.mouse.wheel(0, 600)
        await page.wait_for_timeout(1500)

        # Try Penalty Kick
        kick = page.get_by_role("button", name="Kick!")
        if await kick.count():
            canvas = page.locator("canvas").first
            if await canvas.count():
                box = await canvas.bounding_box()
                if box:
                    await page.mouse.click(box["x"] + box["width"] * 0.75, box["y"] + box["height"] * 0.25)
            await kick.first.click()
            await page.wait_for_timeout(3500)

        await page.mouse.wheel(0, 500)

        # Google Gravity
        grav = page.get_by_role("button", name="Google Gravity")
        if await grav.count():
            await grav.first.click(force=True)
            await page.wait_for_timeout(2200)
            # Drag a little
            await page.mouse.move(640, 360)
            await page.mouse.down()
            await page.mouse.move(760, 440, steps=14)
            await page.mouse.up()
            await page.wait_for_timeout(1800)
            # Clones may cover the Reset button — force-clear then reset
            await page.evaluate(
                """() => {
                  document.querySelectorAll('.gravity-clone').forEach(el => el.remove());
                  const btn = [...document.querySelectorAll('button')]
                    .find(b => /reset pitch/i.test(b.textContent || ''));
                  if (btn) btn.click();
                }"""
            )
            await page.wait_for_timeout(1000)

        # Scroll to Ask Gemini / verdict
        for _ in range(6):
            await page.mouse.wheel(0, 480)
            await page.wait_for_timeout(900)

        # Finish remaining time on CTA / footer
        remaining_ms = int(max(2000, (t * 0.12) * 1000))
        await page.wait_for_timeout(remaining_ms)

        await context.close()
        await browser.close()

    videos = sorted(video_dir.glob("*.webm"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not videos:
        raise RuntimeError("Playwright did not produce a video file")
    return videos[0]


def mux(video_webm: Path, audio_wav: Path, out_mp4: Path, target_seconds: float) -> None:
    ff = ffmpeg_exe()
    # Scale/pad to 1280x720, replace audio with narration, trim to voiceover length
    cmd = [
        ff,
        "-y",
        "-i",
        str(video_webm),
        "-i",
        str(audio_wav),
        "-filter_complex",
        (
            "[0:v]scale=1280:720:force_original_aspect_ratio=decrease,"
            "pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,"
            f"trim=duration={target_seconds:.2f},setpts=PTS-STARTPTS[v];"
            f"[1:a]atrim=duration={target_seconds:.2f},asetpts=PTS-STARTPTS[a]"
        ),
        "-map",
        "[v]",
        "-map",
        "[a]",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        "-movflags",
        "+faststart",
        str(out_mp4),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        print(proc.stderr[-2000:], file=sys.stderr)
        raise RuntimeError("ffmpeg mux failed")


def write_publish_notes(out_mp4: Path, seconds: float) -> None:
    notes = OUT_DIR / "PUBLISH.md"
    notes.write_text(
        f"""# RefMind demo video — publish kit

## Download

**File:** `{out_mp4.name}`  
**Path:** `{out_mp4}`  
**Length:** ~{seconds/60:.1f} minutes  
**Voice:** US woman (`{VOICE}`), casual / slang tone  
**Live product shown:** {DEMO_URL}

## YouTube

**Title:** RefMind — Why Fans Argue About Ref Calls (Live Demo)

**Description:**
Fans vote first. Then RefMind breaks down why disagreements last — rule, truth, sightline, sides — with IFAB context, camera blind spots, Google Translate, Ask Gemini, and a beginner Penalty Kick Lab.

Live demo: {DEMO_URL}

Built for IBM SkillsBuild AI Builders Challenge.

**Tags:** football, soccer, referee, VAR, IFAB, AI explainability, IBM SkillsBuild, Google Gemini, sports tech

## LinkedIn

**Post:**
Just dropped a 2-min live walkthrough of **RefMind** — vote-before-reveal explainability for controversial football calls.

You don't just get a verdict. You get *why the argument never dies* (rule / truth / sightline / sides), plus Google Translate, Gemini tools, and a playful Penalty Kick Lab.

🎬 Watch: [YouTube link]
🔗 Try it: {DEMO_URL}

#SportsTech #AI #Football #IBMSkillsBuild
""",
        encoding="utf-8",
    )


async def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    mp3 = OUT_DIR / "narration.mp3"
    wav = OUT_DIR / "narration.wav"
    video_dir = OUT_DIR / "capture"
    out_mp4 = OUT_DIR / "RefMind-Demo-2min.mp4"

    print("1/3 Generating US female voiceover…")
    if wav.exists() and wav.stat().st_size > 1000 and mp3.exists():
        duration = wav_duration(wav)
        print(f"   Reusing narration: {duration:.1f}s")
    else:
        duration = await make_voiceover(mp3, wav)
        print(f"   Narration length: {duration:.1f}s")

    if duration > 185:
        print("   Trimming export target to 175s.")
        duration = 175.0

    print("2/3 Recording live Vercel walkthrough…")
    webm = await record_walkthrough(video_dir, duration)
    print(f"   Captured: {webm.name}")

    print("3/3 Muxing MP4…")
    mux(webm, wav, out_mp4, duration)
    write_publish_notes(out_mp4, duration)

    meta = {
        "file": str(out_mp4),
        "seconds": round(duration, 1),
        "demo_url": DEMO_URL,
        "voice": VOICE,
    }
    (OUT_DIR / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print("DONE")
    print(out_mp4)
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))

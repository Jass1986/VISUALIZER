#!/usr/bin/env python3
import argparse
import array
import math
import os
import subprocess
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


def parse_args():
    parser = argparse.ArgumentParser(description="Render bass-reactive visualizers.")
    parser.add_argument("--audio", required=True)
    parser.add_argument("--image", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--style", required=True)
    parser.add_argument("--width", type=int, required=True)
    parser.add_argument("--height", type=int, required=True)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--duration", type=float, default=0.0)
    parser.add_argument("--title", default="")
    parser.add_argument("--artist", default="")
    return parser.parse_args()


def decode_audio(audio_path, sample_rate, audio_filter=None):
    command = [
        "ffmpeg",
        "-v",
        "error",
        "-i",
        audio_path,
    ]
    if audio_filter:
        command.extend(["-af", audio_filter])
    command.extend([
        "-ac",
        "1",
        "-ar",
        str(sample_rate),
        "-f",
        "s16le",
        "-",
    ])
    pcm = subprocess.check_output(command)
    sample_array = array.array("h")
    sample_array.frombytes(pcm)
    if not sample_array:
        raise RuntimeError("Could not decode audio samples.")
    return [sample / 32768.0 for sample in sample_array]


def percentile(values, ratio):
    if not values:
        return 0.0
    ordered = sorted(values)
    position = (len(ordered) - 1) * (ratio / 100.0)
    lower = int(math.floor(position))
    upper = int(math.ceil(position))
    if lower == upper:
        return ordered[lower]
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)


def clamp(value, low, high):
    return max(low, min(high, value))


def normalize_series(values):
    low = percentile(values, 12)
    high = percentile(values, 95)
    scale = max(high - low, 1e-6)
    return [clamp((value - low) / scale, 0.0, 1.0) for value in values]


def smooth_series(values, kernel_size):
    radius = max(0, kernel_size // 2)
    smoothed = []
    for index in range(len(values)):
        start = max(0, index - radius)
        stop = min(len(values), index + radius + 1)
        window = values[start:stop]
        smoothed.append(sum(window) / max(1, len(window)))
    return smoothed


def build_peak_envelope(values, trend_window=15, threshold=0.08, decay=0.82):
    trend = smooth_series(values, trend_window)
    hits = []
    for value, baseline in zip(values, trend):
        hits.append(max(0.0, value - baseline - threshold))

    if any(hits):
        peak = max(hits)
        if peak > 0:
            hits = [hit / peak for hit in hits]

    envelope = []
    carry = 0.0
    for hit in hits:
        carry = max(hit, carry * decay)
        envelope.append(clamp(carry, 0.0, 1.0))
    return envelope


def average_absolute(values):
    if not values:
        return 0.0
    return sum(abs(value) for value in values) / len(values)


def chunk_rms(values):
    if not values:
        return 0.0
    return math.sqrt(sum(value * value for value in values) / len(values))


def analyze_audio(samples, bass_samples, mid_samples, high_samples, sample_rate, fps):
    frame_count = max(1, int(math.ceil((len(samples) / sample_rate) * fps)))
    window_size = 2048
    half_window = window_size // 2

    bass_values = []
    mid_values = []
    high_values = []
    wave_values = []
    band_matrix = []

    for frame_index in range(frame_count):
        center = int((frame_index / fps) * sample_rate)
        start = max(0, center - half_window)
        stop = min(len(samples), center + half_window)
        segment = samples[start:stop]
        bass_segment = bass_samples[start:stop]
        mid_segment = mid_samples[start:stop]
        high_segment = high_samples[start:stop]

        if len(segment) < window_size:
            segment = segment + [0.0] * (window_size - len(segment))
        if len(bass_segment) < window_size:
            bass_segment = bass_segment + [0.0] * (window_size - len(bass_segment))
        if len(mid_segment) < window_size:
            mid_segment = mid_segment + [0.0] * (window_size - len(mid_segment))
        if len(high_segment) < window_size:
            high_segment = high_segment + [0.0] * (window_size - len(high_segment))

        bass_values.append(chunk_rms(bass_segment))
        mid_values.append(chunk_rms(mid_segment))
        high_values.append(chunk_rms(high_segment))

        step = max(1, len(segment) // 96)
        wave_sample = segment[::step][:96]
        if len(wave_sample) < 96:
            wave_sample = wave_sample + [0.0] * (96 - len(wave_sample))
        wave_values.append(wave_sample)

        band_values = []
        band_count = 48
        chunk_size = max(1, len(segment) // band_count)
        for band_index in range(band_count):
            chunk = segment[band_index * chunk_size : (band_index + 1) * chunk_size]
            if not chunk:
                chunk = [0.0]
            weight = 1.0 + (1.0 - band_index / max(1, band_count - 1)) * 0.7
            band_values.append(average_absolute(chunk) * weight)
        band_matrix.append(band_values)

    bass = smooth_series(normalize_series(bass_values), 5)
    mid = smooth_series(normalize_series(mid_values), 5)
    high = smooth_series(normalize_series(high_values), 5)
    bass_hits = build_peak_envelope(bass, trend_window=17, threshold=0.09, decay=0.84)
    pulse = [clamp((level * 0.28) + (hit * 0.92), 0.0, 1.0) for level, hit in zip(bass, bass_hits)]

    band_scales = []
    for band_index in range(len(band_matrix[0])):
        column = [math.log1p(row[band_index]) for row in band_matrix]
        scale = max(percentile(column, 96), 1e-6)
        band_scales.append(scale)

    bands = []
    for row in band_matrix:
        normalized_row = []
        for band_index, value in enumerate(row):
            normalized_row.append(clamp(math.log1p(value) / band_scales[band_index], 0.0, 1.0))
        bands.append(normalized_row)

    waves = []
    for row in wave_values:
        peak = max(max(abs(value) for value in row), 1e-4)
        waves.append([clamp(value / peak, -1.0, 1.0) for value in row])

    return {
        "frame_count": frame_count,
        "bass": bass,
        "bass_hits": bass_hits,
        "pulse": pulse,
        "mid": mid,
        "high": high,
        "bands": bands,
        "waves": waves,
    }


def choose_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for candidate in candidates:
        if os.path.exists(candidate):
            try:
                return ImageFont.truetype(candidate, size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def fit_cover(image, width, height, scale, offset_x, offset_y):
    target_width = max(1, int(width * scale))
    target_height = max(1, int(height * scale))
    cover_scale = max(target_width / image.width, target_height / image.height)
    resized = image.resize(
        (max(1, int(image.width * cover_scale)), max(1, int(image.height * cover_scale))),
        Image.Resampling.LANCZOS,
    )

    center_x = (resized.width - width) / 2.0 + offset_x
    center_y = (resized.height - height) / 2.0 + offset_y
    center_x = min(max(center_x, 0), max(0, resized.width - width))
    center_y = min(max(center_y, 0), max(0, resized.height - height))

    return resized.crop((int(center_x), int(center_y), int(center_x + width), int(center_y + height)))


def lerp_color(a, b, amount):
    return tuple(int(a[i] + (b[i] - a[i]) * amount) for i in range(3))


def add_text_and_progress(frame, title, artist, progress, bass):
    width, height = frame.size
    pad = int(min(width, height) * 0.06)
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    title_font = choose_font(max(28, int(height * 0.04)), bold=True)
    artist_font = choose_font(max(18, int(height * 0.022)))

    if title:
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_w = title_bbox[2] - title_bbox[0]
        title_h = title_bbox[3] - title_bbox[1]
        title_x = pad
        title_y = height - int(pad * 2.9)
        draw.rounded_rectangle(
            (title_x - 12, title_y - 8, title_x + title_w + 16, title_y + title_h + 10),
            radius=18,
            fill=(0, 0, 0, 96),
        )
        draw.text((title_x, title_y), title, font=title_font, fill=(255, 255, 255, 240))

    if artist:
        artist_bbox = draw.textbbox((0, 0), artist, font=artist_font)
        artist_w = artist_bbox[2] - artist_bbox[0]
        artist_h = artist_bbox[3] - artist_bbox[1]
        artist_x = pad
        artist_y = height - int(pad * 1.95)
        draw.rounded_rectangle(
            (artist_x - 10, artist_y - 7, artist_x + artist_w + 14, artist_y + artist_h + 10),
            radius=16,
            fill=(0, 0, 0, 72),
        )
        draw.text((artist_x, artist_y), artist, font=artist_font, fill=(210, 244, 255, 235))

    track_w = width - int(pad * 2.2)
    track_h = max(8, int(height * 0.008))
    track_x = pad
    track_y = height - int(pad * 0.9)
    draw.rounded_rectangle((track_x, track_y, track_x + track_w, track_y + track_h), radius=track_h // 2, fill=(255, 255, 255, 46))
    draw.rounded_rectangle(
        (track_x, track_y, track_x + int(track_w * progress), track_y + track_h),
        radius=track_h // 2,
        fill=(48, 213, 255, int(200 + bass * 40)),
    )

    return Image.alpha_composite(frame, overlay)


def draw_bottom_bars(draw, width, height, pad, bins, color_a, color_b, mirrored=True, scale=1.0):
    usable_width = width - pad * 2
    count = len(bins)
    gap = max(2, int(usable_width / (count * 7)))
    bar_width = max(3, int((usable_width - gap * (count - 1)) / count))
    max_height = int(height * 0.28 * scale)
    start_y = height - int(pad * 1.6)

    for index, value in enumerate(bins):
        amount = index / max(1, count - 1)
        color = lerp_color(color_a, color_b, amount)
        bar_height = max(6, int(max_height * (value ** 1.35)))
        x0 = pad + index * (bar_width + gap)
        x1 = x0 + bar_width
        y0 = start_y - bar_height
        draw.rounded_rectangle((x0, y0, x1, start_y), radius=min(8, bar_width // 2), fill=(*color, 230))
        if mirrored:
            mirror_start = start_y + int(pad * 0.2)
            y1 = mirror_start + int(bar_height * 0.45)
            draw.rounded_rectangle((x0, mirror_start, x1, y1), radius=min(8, bar_width // 2), fill=(*color, 86))


def draw_ring(draw, width, height, bins, radius, thickness, color_a, color_b):
    cx = width / 2.0
    cy = height / 2.0
    count = len(bins)
    for index, value in enumerate(bins):
        angle = (index / count) * math.tau - math.pi / 2.0
        inner = radius
        outer = radius + value * thickness
        x0 = cx + math.cos(angle) * inner
        y0 = cy + math.sin(angle) * inner
        x1 = cx + math.cos(angle) * outer
        y1 = cy + math.sin(angle) * outer
        color = lerp_color(color_a, color_b, index / max(1, count - 1))
        draw.line((x0, y0, x1, y1), fill=(*color, 240), width=max(2, int(thickness * 0.08)))


def draw_wave(draw, x_start, width, wave, y_center, amplitude, color, thickness):
    points = []
    for index, value in enumerate(wave):
        x = x_start + (index / max(1, len(wave) - 1)) * width
        y = y_center + value * amplitude
        points.append((x, y))
    draw.line(points, fill=color, width=thickness, joint="curve")


def render_frame(base_image, frame_index, frame_count, style, width, height, bass, bass_hit, pulse, mid, high, bins, wave, title, artist):
    time_position = frame_index / max(1, frame_count - 1)
    pulse_scale = 1.01 + pulse * 0.065 + bass_hit * 0.02
    offset_x = math.sin(frame_index * 0.26) * pulse * 8 + math.cos(frame_index * 0.08) * mid * 2
    offset_y = math.cos(frame_index * 0.21) * pulse * 6
    background = fit_cover(base_image, width, height, pulse_scale, offset_x, offset_y)
    background = ImageEnhance.Brightness(background).enhance(0.96 + pulse * 0.1)
    background = background.convert("RGBA")

    if bass_hit > 0.34:
        bloom = background.filter(ImageFilter.GaussianBlur(radius=2 + bass_hit * 5))
        background = Image.blend(background, bloom, min(0.18, bass_hit * 0.16))

    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    pad = int(min(width, height) * 0.055)

    if style == "basswarp":
        draw.rectangle((0, 0, width, height), fill=(0, 10, 18, 42))
        draw_bottom_bars(draw, width, height, pad, bins, (124, 255, 152), (48, 213, 255), mirrored=True, scale=1.1)
        ring_radius = min(width, height) * (0.15 + pulse * 0.03)
        draw.ellipse(
            (
                width / 2 - ring_radius,
                height / 2 - ring_radius,
                width / 2 + ring_radius,
                height / 2 + ring_radius,
            ),
            outline=(255, 255, 255, int(90 + pulse * 80)),
            width=max(4, int(min(width, height) * 0.008)),
        )
    elif style == "prismring":
        draw.rectangle((0, 0, width, height), fill=(8, 6, 22, 50))
        draw_ring(draw, width, height, bins, min(width, height) * 0.18, min(width, height) * 0.16, (255, 79, 216), (48, 213, 255))
        pulse_radius = min(width, height) * (0.11 + pulse * 0.05)
        draw.ellipse(
            (
                width / 2 - pulse_radius,
                height / 2 - pulse_radius,
                width / 2 + pulse_radius,
                height / 2 + pulse_radius,
            ),
            fill=(255, 255, 255, int(22 + pulse * 28)),
        )
    elif style == "latticebars":
        draw.rectangle((0, 0, width, height), fill=(4, 10, 18, 58))
        panel_w = int(width * 0.78)
        panel_h = int(height * 0.5)
        panel_x = (width - panel_w) // 2
        panel_y = int(height * 0.18)
        draw.rounded_rectangle((panel_x, panel_y, panel_x + panel_w, panel_y + panel_h), radius=28, fill=(255, 255, 255, 22), outline=(255, 255, 255, 48), width=2)
        usable = bins[:24]
        bar_area_y = panel_y + int(panel_h * 0.12)
        bar_area_h = int(panel_h * 0.72)
        gap = max(4, int(panel_w / 120))
        bar_w = max(6, int((panel_w - gap * (len(usable) + 1)) / len(usable)))
        for index, value in enumerate(usable):
            color = lerp_color((48, 213, 255), (255, 255, 255), index / max(1, len(usable) - 1))
            x = panel_x + gap + index * (bar_w + gap)
            bar_h = max(12, int(bar_area_h * (value ** 1.4)))
            y = bar_area_y + bar_area_h - bar_h
            draw.rounded_rectangle((x, y, x + bar_w, bar_area_y + bar_area_h), radius=10, fill=(*color, 210))
    elif style == "shockwave":
        draw.rectangle((0, 0, width, height), fill=(0, 0, 0, 52))
        for wave_index in range(3):
            radius = min(width, height) * (0.12 + pulse * 0.22 + wave_index * 0.08)
            alpha = max(0, int(70 + pulse * 120 - wave_index * 28))
            draw.ellipse(
                (
                    width / 2 - radius,
                    height / 2 - radius,
                    width / 2 + radius,
                    height / 2 + radius,
                ),
                outline=(48, 213, 255, alpha),
                width=max(3, int(min(width, height) * 0.006)),
            )
        draw_wave(
            draw,
            pad,
            width - pad * 2,
            wave,
            height * 0.72,
            height * 0.05 * (0.45 + pulse),
            (255, 255, 255, 220),
            max(3, int(min(width, height) * 0.006)),
        )
    else:
        draw.rectangle((0, 0, width, height), fill=(0, 0, 0, 40))
        draw_bottom_bars(draw, width, height, pad, bins, (48, 213, 255), (255, 119, 204), mirrored=True, scale=1.0)

    composited = Image.alpha_composite(background, overlay)
    return add_text_and_progress(composited, title, artist, time_position, bass).convert("RGB")


def main():
    args = parse_args()
    fps = max(12, args.fps)
    sample_rate = 22050
    print("status=Analyzing audio...", flush=True)
    audio_samples = decode_audio(args.audio, sample_rate)
    bass_samples = decode_audio(args.audio, sample_rate, "lowpass=f=180")
    mid_samples = decode_audio(args.audio, sample_rate, "highpass=f=180,lowpass=f=2000")
    high_samples = decode_audio(args.audio, sample_rate, "highpass=f=2000")
    audio_duration = len(audio_samples) / sample_rate
    duration = args.duration if args.duration and args.duration > 0 else audio_duration
    frame_count = max(1, int(math.ceil(duration * fps)))

    sample_limit = int(duration * sample_rate)
    analysis = analyze_audio(
        audio_samples[:sample_limit],
        bass_samples[:sample_limit],
        mid_samples[:sample_limit],
        high_samples[:sample_limit],
        sample_rate,
        fps,
    )
    analysis["frame_count"] = frame_count

    base_image = Image.open(args.image).convert("RGB")
    ffmpeg_command = [
        "ffmpeg",
        "-y",
        "-v",
        "error",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{args.width}x{args.height}",
        "-r",
        str(fps),
        "-i",
        "-",
        "-i",
        args.audio,
        "-t",
        f"{duration:.3f}",
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        args.output,
    ]

    ffmpeg_process = subprocess.Popen(ffmpeg_command, stdin=subprocess.PIPE)
    print("status=Rendering bass-reactive frames...", flush=True)

    for frame_index in range(frame_count):
        frame = render_frame(
            base_image=base_image,
            frame_index=frame_index,
            frame_count=frame_count,
            style=args.style,
            width=args.width,
            height=args.height,
            bass=float(analysis["bass"][frame_index]),
            bass_hit=float(analysis["bass_hits"][frame_index]),
            pulse=float(analysis["pulse"][frame_index]),
            mid=float(analysis["mid"][frame_index]),
            high=float(analysis["high"][frame_index]),
            bins=analysis["bands"][frame_index],
            wave=analysis["waves"][frame_index],
            title=args.title,
            artist=args.artist,
        )
        ffmpeg_process.stdin.write(frame.tobytes())
        if frame_index % max(1, frame_count // 30) == 0 or frame_index == frame_count - 1:
            progress = 12 + int((frame_index / max(1, frame_count - 1)) * 86)
            print(f"progress={progress}", flush=True)

    ffmpeg_process.stdin.close()
    return_code = ffmpeg_process.wait()
    if return_code != 0:
        raise RuntimeError("ffmpeg failed while encoding the bass-reactive visualizer.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"status=Failed: {exc}", flush=True)
        raise

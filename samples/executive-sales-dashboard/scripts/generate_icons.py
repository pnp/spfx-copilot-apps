"""Generate the Teams/Copilot agent icons for the Executive Sales Dashboard.

- color.png   : 192x192 full-color icon (blue background, white bar chart + trend
                line, and the text "Exec Dashboard").
- outline.png : 32x32 transparent monochrome (white) bar-chart glyph.
"""
from PIL import Image, ImageDraw, ImageFont

ARIAL_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def load_font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(ARIAL_BOLD, size)


def fit_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, start: int) -> ImageFont.FreeTypeFont:
    size = start
    while size > 8:
        font = load_font(size)
        if draw.textlength(text, font=font) <= max_width:
            return font
        size -= 1
    return load_font(8)


def rounded_bar(draw, x, y, w, h, radius, fill):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=fill)


def make_color() -> Image.Image:
    size = 192
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Vertical blue gradient background (Fluent brand-ish).
    top = (32, 120, 214)     # #2078D6
    bottom = (11, 76, 160)   # #0B4CA0
    for y in range(size):
        t = y / (size - 1)
        r = round(top[0] + (bottom[0] - top[0]) * t)
        g = round(top[1] + (bottom[1] - top[1]) * t)
        b = round(top[2] + (bottom[2] - top[2]) * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    white = (255, 255, 255, 255)
    soft = (255, 255, 255, 235)

    # Chart baseline.
    base_y = 118
    left_x = 44
    draw.line([(left_x, 46), (left_x, base_y)], fill=(255, 255, 255, 150), width=2)
    draw.line([(left_x, base_y), (150, base_y)], fill=(255, 255, 255, 150), width=2)

    # Bars (rising).
    bar_w = 18
    gaps = 8
    heights = [34, 54, 46, 70]
    xs = []
    for i, h in enumerate(heights):
        x = left_x + 8 + i * (bar_w + gaps)
        xs.append(x + bar_w / 2)
        rounded_bar(draw, x, base_y - h, bar_w, h, radius=4, fill=soft)

    # Trend line + markers across the bar tops (rising).
    pts = [(xs[i], base_y - heights[i] - 8) for i in range(len(heights))]
    draw.line(pts, fill=white, width=3, joint="curve")
    for px, py in pts:
        draw.ellipse([px - 3.5, py - 3.5, px + 3.5, py + 3.5], fill=white)

    # Text "Exec Dashboard".
    text = "Exec Dashboard"
    font = fit_font(draw, text, max_width=size - 24, start=26)
    tw = draw.textlength(text, font=font)
    ascent, descent = font.getmetrics()
    ty = 138
    draw.text(((size - tw) / 2, ty), text, font=font, fill=white)

    return img


def make_outline() -> Image.Image:
    size = 32
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)

    base_y = 25
    left_x = 6
    # Axis.
    draw.line([(left_x, 6), (left_x, base_y)], fill=white, width=2)
    draw.line([(left_x, base_y), (27, base_y)], fill=white, width=2)

    # Bars.
    bar_w = 4
    gap = 2
    heights = [7, 12, 9, 16]
    for i, h in enumerate(heights):
        x = left_x + 3 + i * (bar_w + gap)
        draw.rectangle([x, base_y - h, x + bar_w, base_y], fill=white)

    return img


make_color().save("copilot/color.png")
make_outline().save("copilot/outline.png")
print("Wrote copilot/color.png and copilot/outline.png")

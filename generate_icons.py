"""
Pure Python (Standard Library only) PNG icon generator for CrossSafe.
Generates icon-192.png and icon-512.png without requiring Pillow.
"""
import zlib
import struct
import os

def write_png(filename, width, height, pixels):
    """
    Writes a 24-bit RGB PNG file.
    pixels: list of rows, each row is a list of (r, g, b) tuples or a bytearray of [r, g, b, ...]
    """
    raw_data = bytearray()
    for row in pixels:
        raw_data.append(0)  # filter type 0 (None)
        raw_data.extend(row)

    compressed = zlib.compress(bytes(raw_data), 9)

    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack(">I", zlib.crc32(c) & 0xffffffff)
        return struct.pack(">I", len(data)) + c + crc

    png = bytearray(b"\x89PNG\r\n\x1a\n")
    # IHDR
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    png.extend(chunk(b"IHDR", ihdr))
    # IDAT
    png.extend(chunk(b"IDAT", compressed))
    # IEND
    png.extend(chunk(b"IEND", b""))

    with open(filename, "wb") as f:
        f.write(png)

def generate_crosssafe_icon(size, out_path):
    rows = []
    center = size / 2.0
    radius = size * 0.46
    corner_radius = size * 0.22

    for y in range(size):
        row = bytearray()
        for x in range(size):
            # Rounded squircle distance
            dx = max(abs(x - center) - (center - corner_radius), 0)
            dy = max(abs(y - center) - (center - corner_radius), 0)
            dist_sq = dx * dx + dy * dy

            if dist_sq > corner_radius * corner_radius:
                # Outside squircle background -> very dark border
                r, g, b = 10, 13, 20
            else:
                # Inside icon tile
                # Check if inside center shield/beacon
                rel_x = (x - center) / (size * 0.4)
                rel_y = (y - center) / (size * 0.4)

                # Shield boundary approx:
                is_shield = (rel_y > -0.8 and rel_y < 0.9 and abs(rel_x) < (0.85 - rel_y * 0.35))

                if is_shield:
                    # Red on left, Blue on right
                    if x < center - 2:
                        # Red side
                        r, g, b = 255, 10, 35
                    elif x > center + 2:
                        # Blue side
                        r, g, b = 0, 80, 255
                    else:
                        # Black divider
                        r, g, b = 10, 13, 20

                    # Pedestrian shape cutout in center (white)
                    # Head
                    dist_head = ((x - center) ** 2 + (y - (center - size * 0.16)) ** 2) ** 0.5
                    if dist_head < size * 0.055:
                        r, g, b = 255, 255, 255
                    
                    # Torso / Body
                    if abs(x - center) < size * 0.045 and (center - size * 0.08) <= y <= (center + size * 0.14):
                        r, g, b = 255, 255, 255

                    # Crossbeam / Walking Leg
                    if abs(x - (center - size * 0.05)) < size * 0.035 and (center + size * 0.12) <= y <= (center + size * 0.22):
                        r, g, b = 255, 255, 255
                    if abs(x - (center + size * 0.06)) < size * 0.035 and (center + size * 0.12) <= y <= (center + size * 0.22):
                        r, g, b = 255, 255, 255
                else:
                    # Dark elegant background
                    diag = (x + y) / (2.0 * size)
                    r = int(14 + diag * 15)
                    g = int(18 + diag * 20)
                    b = int(28 + diag * 30)

            row.extend([r, g, b])
        rows.append(row)

    write_png(out_path, size, size, rows)
    print(f"Generated {out_path} ({size}x{size})")

if __name__ == "__main__":
    os.makedirs("icons", exist_ok=True)
    generate_crosssafe_icon(192, "icons/icon-192.png")
    generate_crosssafe_icon(512, "icons/icon-512.png")
